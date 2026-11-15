#!/usr/bin/env python3
"""Lilas Shopifyテーマ 編集用フォルダ ⇄ Shopify形式 変換ツール

  python3 theme_tool.py build            src/ → dist/(Shopify形式)+ release/ にzip
  python3 theme_tool.py watch            src/ を見張って、変更のたびに dist/ を更新
  python3 theme_tool.py import <path>    Shopifyから書き出したテーマ(フォルダ/zip)を src/ に取り込む
  python3 theme_tool.py map              画像の使用箇所一覧を作り直す
  python3 theme_tool.py publish [ブランチ] Shopifyの変更を取り込み → ビルド → 指定ブランチ(既定 main)へ公開

標準ライブラリだけで動きます(追加インストール不要)。
"""
import os, re, sys, shutil, zipfile, tempfile, time, datetime, collections, hashlib, subprocess, tarfile, io

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
DIST = os.path.join(ROOT, 'dist')
RELEASE = os.path.join(ROOT, 'release')

# Shopifyのフォルダ名。src内では、いちばん近い祖先フォルダの名前で行き先が決まる
THEME_DIRS = {'layout', 'sections', 'snippets', 'templates', 'config', 'locales', 'blocks'}
# これらのフォルダの中身はすべて assets/ へ
ASSET_DIRS = {'css', 'js', 'images', 'fonts', 'assets', 'media'}
IGNORE = re.compile(r'(^\.|^_|\.md$|\.txt$|~$|\.DS_Store$)')

# ---------- ページの振り分けルール(import時) ----------
PAGES = [
    # (src内のフォルダ, ファイル名に含まれるキー)
    ('pages/top',                 ['lx-top-', 'lx-tail-top', 'lilas-index', 'templates/index.json']),
    ('pages/features',            ['features']),
    ('pages/products',            ['lx-products-', 'lx-tail-products', 'lilas-products', 'page.lilas-products']),
    ('pages/message',             ['message']),
    ('pages/about',               ['about']),
    ('pages/guide',               ['guide']),
    ('pages/legal/privacy',       ['privacy']),
    ('pages/legal/terms',         ['terms']),
    ('pages/legal/tokushoho',     ['tokushoho']),
]
for p in ['aging', 'bright', 'calmsmooth', 'sensitive', 'smooth', 'oil', 'serum', 'balm']:
    PAGES.append((f'pages/product/{p}', [f'product-{p}']))

COMMON_KEYS = {
    'common/header':       ['lx-header', 'header-group', 'lx-announcement'],
    'common/footer':       ['lx-footer', 'footer-group', 'lx-service-band'],
    'common/news':         ['lx-news'],
    'common/system':       ['lx-tail-system', 'lilas-system', 'lx-video-src'],
    'common/shopify':      ['lilas-shopify', 'lilas-cart'],
}

def subdir_for(name):
    ext = name.rsplit('.', 1)[-1].lower()
    if ext == 'css': return 'css'
    if ext == 'js': return 'js'
    if ext in ('woff', 'woff2', 'ttf', 'otf'): return 'fonts'
    return 'images'

def classify(rel, img_owner=None):
    """Shopify形式の相対パス(例 sections/lx-top-01.liquid)→ src内の相対パス"""
    kind, name = rel.split('/', 1)
    key = rel if kind == 'templates' else name
    if kind == 'assets':
        if img_owner and name in img_owner:
            return f'{img_owner[name]}/images/{name}'
        sub = subdir_for(name)
        for folder, keys in COMMON_KEYS.items():
            if any(k in name for k in keys): return f'{folder}/{sub}/{name}'
        for folder, keys in PAGES:
            if any(k in key for k in keys): return f'{folder}/{sub}/{name}'
        return f'common/{sub}/{name}'
    if kind == 'layout':
        return f'common/layout/{name}'
    for folder, keys in COMMON_KEYS.items():
        if any(k in name for k in keys): return f'{folder}/{kind}/{name}'
    if name.startswith('lx-') or name.startswith('page.lilas-') or key == 'templates/index.json':
        for folder, keys in PAGES:
            if any(k in key for k in keys): return f'{folder}/{kind}/{name}'
    return f'shopify/{kind}/{name}'   # Shopify標準(main-*, config, locales など)

# ---------- src → Shopify形式 ----------
def dest_for(src_rel):
    parts = src_rel.split('/')
    for d in reversed(parts[:-1]):
        if d in THEME_DIRS: return f'{d}/{parts[-1]}'
        if d in ASSET_DIRS: return f'assets/{parts[-1]}'
    return None

def collect():
    mapping, errors = {}, []
    for root, dirs, files in os.walk(SRC):
        dirs[:] = sorted(d for d in dirs if not IGNORE.search(d))
        for f in sorted(files):
            if IGNORE.search(f): continue
            full = os.path.join(root, f)
            rel = os.path.relpath(full, SRC).replace(os.sep, '/')
            dest = dest_for(rel)
            if not dest:
                errors.append(f'行き先が決まりません(sections/ や css/ などのフォルダに入れてください): src/{rel}')
                continue
            if dest in mapping:
                errors.append(f'同じ名前のファイルが2つあります: src/{os.path.relpath(mapping[dest], SRC)} と src/{rel}')
                continue
            mapping[dest] = full
    return mapping, errors

def check_refs(mapping):
    have = {d.split('/', 1)[1] for d in mapping if d.startswith('assets/')}
    secs = {d.split('/', 1)[1][:-7] for d in mapping if d.startswith('sections/') and d.endswith('.liquid')}
    snips = {d.split('/', 1)[1][:-7] for d in mapping if d.startswith('snippets/')}
    warns = []
    for dest, full in mapping.items():
        if not dest.endswith(('.liquid', '.json', '.css', '.js')): continue
        t = open(full, encoding='utf-8', errors='ignore').read()
        for m in set(re.findall(r"['\"]([\w.\-]+\.(?:webp|png|jpe?g|gif|svg|css|js|woff2?|mp4))['\"]\s*\|\s*asset_url", t)):
            if m not in have: warns.append(f'{dest}: アセット「{m}」が見つかりません')
        for m in set(re.findall(r"\{%-?\s*render\s+['\"]([\w\-]+)['\"]", t)):
            if m not in snips: warns.append(f'{dest}: スニペット「{m}」が見つかりません')
        if dest.startswith('templates/') and dest.endswith('.json'):
            for m in set(re.findall(r'"type"\s*:\s*"([\w\-]+)"', t)):
                if m not in secs and not m.startswith(('@', 'shopify://')) and m != 'header' and m != 'footer':
                    warns.append(f'{dest}: セクション「{m}」が見つかりません')
    return warns

def same(a, b):
    if not os.path.exists(b) or os.path.getsize(a) != os.path.getsize(b): return False
    with open(a, 'rb') as x, open(b, 'rb') as y: return x.read() == y.read()

def build(make_zip=True, quiet=False):
    mapping, errors = collect()
    if errors:
        print('\n'.join('✗ ' + e for e in errors)); print('ビルドを中止しました。'); return False
    changed = 0
    for dest, full in mapping.items():
        out = os.path.join(DIST, dest)
        if not same(full, out):
            os.makedirs(os.path.dirname(out), exist_ok=True); shutil.copy2(full, out); changed += 1
    removed = 0
    if os.path.isdir(DIST):
        for root, _, files in os.walk(DIST):
            for f in files:
                rel = os.path.relpath(os.path.join(root, f), DIST).replace(os.sep, '/')
                if rel not in mapping: os.remove(os.path.join(root, f)); removed += 1
    warns = check_refs(mapping)
    for w in warns: print('⚠ ' + w)
    if not quiet or changed or removed:
        print(f'✓ dist/ を更新しました(全{len(mapping)}ファイル/更新{changed}・削除{removed})')
    if make_zip:
        os.makedirs(RELEASE, exist_ok=True)
        stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M')
        zp = os.path.join(RELEASE, f'lilas-theme_{stamp}.zip')
        with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
            for dest in sorted(mapping): z.write(os.path.join(DIST, dest), dest)
        print(f'✓ アップロード用zip: release/{os.path.basename(zp)}')
    return True

def snapshot():
    s = {}
    for root, dirs, files in os.walk(SRC):
        for f in files:
            p = os.path.join(root, f)
            try: s[p] = os.path.getmtime(p)
            except OSError: pass
    return s

def watch():
    print('src/ を見張っています(止めるときは Ctrl+C)')
    build(make_zip=False); last = snapshot()
    try:
        while True:
            time.sleep(0.7); now = snapshot()
            if now != last:
                last = now; print(time.strftime('%H:%M:%S'), end=' '); build(make_zip=False, quiet=True)
    except KeyboardInterrupt:
        print('\n終了しました。')

# ---------- Shopify形式 → src ----------
def image_owners(theme_dir):
    """各画像を、使っているページのフォルダへ。複数ページで使う画像は common/images へ"""
    users = collections.defaultdict(set)
    for kind in ('sections', 'snippets', 'templates', 'layout', 'assets'):
        d = os.path.join(theme_dir, kind)
        if not os.path.isdir(d): continue
        for f in os.listdir(d):
            if not f.endswith(('.liquid', '.json', '.css', '.js')): continue
            t = open(os.path.join(d, f), encoding='utf-8', errors='ignore').read()
            folder = classify(f'{kind}/{f}').rsplit('/', 2)[0]
            for m in set(re.findall(r'[\w.\-]+\.(?:webp|png|jpe?g|gif|svg)', t)):
                users[m].add(folder)
    own = {}
    for img, fs in users.items():
        fs = {f for f in fs if not f.startswith('shopify')} or fs
        own[img] = fs.pop() if len(fs) == 1 else 'common/shared'
    return own

def find_theme_root(path):
    for root, dirs, _ in os.walk(path):
        if 'layout' in dirs and 'templates' in dirs: return root
    return None

def do_import(path):
    tmp = None
    if path.endswith('.zip'):
        tmp = tempfile.mkdtemp(); zipfile.ZipFile(path).extractall(tmp); path = tmp
    theme = find_theme_root(path)
    if not theme:
        print('✗ テーマのフォルダ(layout/ と templates/ がある場所)が見つかりません'); return
    existing = {}
    if os.path.isdir(SRC):
        mapping, _ = collect()
        existing = {d: f for d, f in mapping.items()}
    owners = image_owners(theme)
    new, upd, same_n = [], [], 0
    seen = set()
    for kind in sorted(os.listdir(theme)):
        kd = os.path.join(theme, kind)
        if not os.path.isdir(kd) or kind not in THEME_DIRS | {'assets'}: continue
        for f in sorted(os.listdir(kd)):
            if f.startswith('.'): continue
            rel = f'{kind}/{f}'; seen.add(rel)
            srcf = os.path.join(kd, f)
            target = existing.get(rel) or os.path.join(SRC, classify(rel, owners))
            if os.path.exists(target):
                if same(srcf, target): same_n += 1; continue
                upd.append(os.path.relpath(target, ROOT))
            else:
                new.append(os.path.relpath(target, ROOT))
            os.makedirs(os.path.dirname(target), exist_ok=True); shutil.copy2(srcf, target)
    gone = [os.path.relpath(f, ROOT) for d, f in existing.items() if d not in seen]
    print(f'✓ 取り込み完了: 新規{len(new)}・更新{len(upd)}・変化なし{same_n}')
    for x in upd: print('  更新 ' + x)
    for x in new[:30]: print('  新規 ' + x)
    if len(new) > 30: print(f'  …ほか{len(new)-30}件')
    if gone:
        print('⚠ Shopify側にないファイル(src/には残しています。不要なら手で消してください):')
        for x in gone: print('  ' + x)
    if tmp: shutil.rmtree(tmp, ignore_errors=True)
    write_map()

# ---------- 画像の使用箇所一覧 ----------
def write_map():
    mapping, _ = collect()
    users = collections.defaultdict(list)
    for dest, full in mapping.items():
        if dest.endswith(('.liquid', '.json', '.css', '.js')):
            t = open(full, encoding='utf-8', errors='ignore').read()
            for m in set(re.findall(r'[\w.\-]+\.(?:webp|png|jpe?g|gif|svg)', t)):
                users[m].append(os.path.relpath(full, SRC))
    lines = ['# 画像の使用箇所一覧(自動生成)', '', '| 画像 | 置き場所 | 使っているファイル |', '|---|---|---|']
    for dest, full in sorted(mapping.items()):
        if dest.startswith('assets/') and dest.endswith(('.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg')):
            n = dest.split('/', 1)[1]
            lines.append(f'| {n} | {os.path.relpath(os.path.dirname(full), SRC)} | {"<br>".join(sorted(users.get(n, ["(未使用)"])))} |')
    open(os.path.join(ROOT, '画像の使用箇所.md'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')


# ---------- GitHub(Shopify連携ブランチ)へ公開 ----------
def git(*args, cwd=None, check=True, capture=True):
    r = subprocess.run(['git', *args], cwd=cwd or ROOT, text=True,
                       stdout=subprocess.PIPE if capture else None, stderr=subprocess.PIPE if capture else None)
    if check and r.returncode != 0:
        raise SystemExit(f'✗ git {" ".join(args)} に失敗しました\n{(r.stderr or "").strip()}')
    return (r.stdout or '').strip()


def pull_from_shopify(base, ref, branch):
    rows = git('diff', '--name-status', '--no-renames', base, ref)
    if not rows:
        print('② Shopify側の変更はありません'); return
    print(f'② Shopify側で変わったファイルを src/ に取り込みます')
    mapping, _ = collect()
    def show(rev, path):
        r = subprocess.run(['git', 'show', f'{rev}:{path}'], cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        return r.stdout if r.returncode == 0 else None
    took, conflicts, deleted = [], [], []
    for line in rows.splitlines():
        st, path = line.split('\t', 1)
        if '/' not in path or path.split('/', 1)[0] not in THEME_DIRS | {'assets'}: continue
        target = mapping.get(path) or os.path.join(SRC, classify(path))
        if st == 'D':
            deleted.append(os.path.relpath(target, ROOT)); continue
        theirs = show(ref, path); basev = show(base, path)
        mine = open(target, 'rb').read() if os.path.exists(target) else None
        if mine == theirs: continue
        if mine is None or mine == basev:
            os.makedirs(os.path.dirname(target), exist_ok=True)
            open(target, 'wb').write(theirs); took.append(os.path.relpath(target, ROOT))
        else:
            d, n = os.path.split(target)
            cp = os.path.join(d, '_shopify版_' + n)
            open(cp, 'wb').write(theirs); conflicts.append(os.path.relpath(cp, ROOT))
    for x in took: print('  取り込み ' + x)
    for x in deleted: print('  ⚠ Shopify側で削除されています(src/には残しています): ' + x)
    if conflicts:
        print('✗ 同じファイルが、ローカルとShopifyの両方で変更されています。')
        print('  Shopify側の内容を「_shopify版_〜」として隣に置きました。見比べて元のファイルにまとめ、')
        print('  _shopify版_ のファイルを消してコミットしてから、もう一度公開してください:')
        for x in conflicts: print('  ' + x)
        raise SystemExit(1)
    if took:
        git('add', '-A'); git('commit', '-q', '-m', f'Shopifyでの変更を取り込み({ref})')
        print('  → 取り込んだ変更を develop にコミットしました')

def publish(target='main'):
    branch = git('rev-parse', '--abbrev-ref', 'HEAD')
    if branch == target:
        raise SystemExit(f'✗ いまは {target} ブランチにいます。develop に切り替えてから実行してください(git switch develop)')
    if git('status', '--porcelain'):
        raise SystemExit('✗ コミットしていない変更があります。先にコミットしてから公開してください\n' + git('status', '--short'))
    print(f'① GitHubの最新を確認しています…')
    git('fetch', 'origin')
    remote_exists = bool(git('ls-remote', '--heads', 'origin', target))

    # ② Shopify側(テーマエディタ等)の変更を src/ に取り込む(前回の公開以降に main で変わったファイルだけ)
    base_file = os.path.join(ROOT, f'.shopify-base-{target}')
    base = open(base_file).read().strip() if os.path.exists(base_file) else ''
    if remote_exists:
        if not base or subprocess.run(['git', 'cat-file', '-e', base + '^{commit}'], cwd=ROOT).returncode != 0:
            raise SystemExit(f'✗ 前回の公開記録(.shopify-base-{target})が見つかりません。READMEの「困ったとき」を見てください')
        pull_from_shopify(base, f'origin/{target}', branch)
    else:
        print(f'② origin/{target} はまだありません。新しく作ります')

    # ③ ビルド
    print('③ ビルドしています')
    if not build(make_zip=False):
        raise SystemExit('✗ ビルドに失敗したため、公開を中止しました')

    # ④ 公開用ブランチに dist/ の中身を反映
    wt = os.path.join(ROOT, '.publish')
    git('worktree', 'remove', '--force', wt, check=False); shutil.rmtree(wt, ignore_errors=True)
    git('worktree', 'prune', check=False)
    if remote_exists:
        git('worktree', 'add', '-q', '-B', target, wt, f'origin/{target}')
    else:
        git('worktree', 'add', '-q', '--detach', wt)
        git('checkout', '-q', '--orphan', target, cwd=wt)
    try:
        for name in os.listdir(wt):
            if name == '.git': continue
            pth = os.path.join(wt, name)
            shutil.rmtree(pth) if os.path.isdir(pth) else os.remove(pth)
        for name in os.listdir(DIST):
            src = os.path.join(DIST, name)
            (shutil.copytree if os.path.isdir(src) else shutil.copy2)(src, os.path.join(wt, name))
        git('add', '-A', cwd=wt)
        if not git('status', '--porcelain', cwd=wt):
            print(f'④ {target} はすでに最新です(変更なし)')
        else:
            sha = git('rev-parse', '--short', 'HEAD')
            stamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
            git('commit', '-q', '-m', f'公開 {stamp}({branch} {sha} をビルド)', cwd=wt)
            print(f'④ {target} にコミットしました。GitHubへ送ります')
            r = subprocess.run(['git', 'push', 'origin', f'{target}:{target}'], cwd=wt)
            if r.returncode != 0:
                raise SystemExit('✗ 送信に失敗しました。直前にShopify側で保存があった可能性があります。もう一度実行してください')
        new_base = git('rev-parse', 'HEAD', cwd=wt)
    finally:
        git('worktree', 'remove', '--force', wt, check=False)
    if new_base != base:
        open(base_file, 'w').write(new_base + '\n')
        git('add', base_file); git('commit', '-q', '-m', f'公開記録を更新({target} {new_base[:7]})')
    subprocess.run(['git', 'push', '-q', 'origin', branch], cwd=ROOT)
    print(f'✓ 完了しました。数十秒ほどで、{target} につないだShopifyのテーマに反映されます')

if __name__ == '__main__':
    a = sys.argv[1:]
    cmd = a[0] if a else 'build'
    if cmd == 'build': build()
    elif cmd == 'watch': watch()
    elif cmd == 'import' and len(a) > 1: do_import(a[1])
    elif cmd == 'publish': publish(a[1] if len(a) > 1 else 'main')
    elif cmd == 'map': write_map(); print('✓ 画像の使用箇所.md を更新しました')
    else: print(__doc__)
