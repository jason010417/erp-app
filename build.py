#!/usr/bin/env python3
"""
build.py — 將 ERP 應用打包成單一 HTML 檔案
用法：python3 build.py
輸出：index-bundle.html
"""

import re
import os
import base64
from pathlib import Path

BASE = Path(__file__).parent

def read(path):
    return Path(path).read_text(encoding='utf-8')

def read_bytes(path):
    return Path(path).read_bytes()

html = read(BASE / 'index.html')

# ── 1. 內聯本地 CSS ──
def inline_css(m):
    href = m.group(1)
    if href.startswith('http'):
        return m.group(0)   # 保留 CDN
    css_path = BASE / href
    if not css_path.exists():
        return m.group(0)
    css = read(css_path)
    return f'<style>\n{css}\n</style>'

html = re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\']([^"\']+)["\'][^>]*/?>',
              inline_css, html)
html = re.sub(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']stylesheet["\'][^>]*/?>',
              inline_css, html)

# ── 2. 移除 manifest link（在 bundle 中無作用）──
html = re.sub(r'\s*<link[^>]+rel=["\']manifest["\'][^>]*/?>', '', html)

# ── 3. 內聯 SVG icon（轉成 data URI）──
icon_path = BASE / 'assets/icon.svg'
if icon_path.exists():
    svg_b64 = base64.b64encode(read_bytes(icon_path)).decode()
    html = re.sub(
        r'<link[^>]+rel=["\']icon["\'][^>]+href=["\']assets/icon\.svg["\'][^>]*/?>',
        f'<link rel="icon" href="data:image/svg+xml;base64,{svg_b64}" type="image/svg+xml" />',
        html
    )

# ── 4. 內聯本地 JS（依序，保留 CDN script）──
def inline_js(m):
    src = m.group(1)
    if src.startswith('http'):
        return m.group(0)   # 保留 Firebase / CDN
    js_path = BASE / src
    if not js_path.exists():
        print(f'  ⚠️  找不到 {src}，跳過')
        return ''
    js = read(js_path)
    return f'<script>\n/* ── {src} ── */\n{js}\n</script>'

html = re.sub(r'<script\s+src=["\']([^"\']+)["\'][^>]*></script>',
              inline_js, html)

# ── 5. 移除 Service Worker 註冊（單一檔案環境無法使用）──
html = re.sub(
    r"<script>\s*if\('serviceWorker'[^<]*</script>",
    '<!-- service worker removed in bundle -->',
    html, flags=re.DOTALL
)

# ── 6. 輸出 ──
out_path = BASE / 'index-bundle.html'
out_path.write_text(html, encoding='utf-8')

size_kb = out_path.stat().st_size / 1024
print(f'✅ 打包完成：{out_path.name}  ({size_kb:.0f} KB)')
