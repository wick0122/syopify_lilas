#!/bin/bash
cd "$(dirname "$0")"
P=$(osascript -e 'POSIX path of (choose file with prompt "Shopifyから書き出したテーマのzipを選んでください" of type {"zip"})' 2>/dev/null)
if [ -z "$P" ]; then echo "キャンセルしました"; else python3 theme_tool.py import "$P"; fi
echo
read -n 1 -s -r -p "何かキーを押すと閉じます"
