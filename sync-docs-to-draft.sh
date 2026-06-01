#!/bin/sh

set -eu

rsync -a --delete \
  "/Users/song2000/Documents/赛博算命/docs/" \
  "/Users/song2000/Documents/赛博算命/开发/web/"

echo "已把 docs/ 同步到 开发/web/"
