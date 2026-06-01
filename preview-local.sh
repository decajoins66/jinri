#!/bin/sh

set -eu

TARGET="${1:-docs}"
PORT="${2:-4173}"

case "${TARGET}" in
  docs)
    PREVIEW_PATH="docs/"
    ;;
  draft|开发/web)
    PREVIEW_PATH="开发/web/"
    ;;
  *)
    echo "用法: ./preview-local.sh [docs|draft] [port]"
    exit 1
    ;;
esac

echo "本地预览已启动："
echo "  http://127.0.0.1:${PORT}/${PREVIEW_PATH}"
echo
echo "按 Ctrl+C 停止预览。"

exec python3 -m http.server "${PORT}" --bind 127.0.0.1
