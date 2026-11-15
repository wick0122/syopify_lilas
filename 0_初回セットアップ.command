#!/bin/bash
# 初回だけ:このフォルダを GitHub(wick0122/syopify_lilas)へ送ります
cd "$(dirname "$0")"
git remote get-url origin >/dev/null 2>&1 || git remote add origin https://github.com/wick0122/syopify_lilas.git
git push -u origin main && git push -u origin develop && git switch -q develop && echo "✓ main と develop を GitHub に送りました"
echo
read -n 1 -s -r -p "何かキーを押すと閉じます"
