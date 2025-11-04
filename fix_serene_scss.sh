#!/usr/bin/env bash
set -e

target="themes/serene/sass/main.scss"
if [ -f "$target" ]; then
  echo "Patching $target for Zola compatibility..."

  # 将 @supports not selector(...) 替换为 @supports (display: block)
  # 保留结构，Zola 就能编译通过
  sed -i 's/@supports not selector(::-webkit-scrollbar)/@supports (display: block)/g' "$target"
fi
