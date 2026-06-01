#!/bin/sh

set -eu

rsync -a --delete \
  "/Users/song2000/Documents/赛博算命/开发/web/" \
  "/Users/song2000/Documents/赛博算命/docs/"

echo "已把 开发/web/ 发布到 docs/"
