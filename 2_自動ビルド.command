#!/bin/bash
cd "$(dirname "$0")"
python3 theme_tool.py watch
echo
read -n 1 -s -r -p "何かキーを押すと閉じます"
