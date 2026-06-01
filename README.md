# 今日灵签

一个适合朋友试玩分享的轻量 H5 抽签页面。

## 当前可用部署

- GitHub Pages 发布目录：`docs/`

## 本地目录说明

- `开发/web`：本地草稿版，适合先试样式和交互
- `开发/server`：本地试玩用的轻量统计服务
- `docs`：唯一正式发布版，GitHub Pages 使用这里
- `部署`：部署说明文档

## 本地预览

不要直接双击 `index.html` 打开，因为页面会用 `fetch()` 读取 `data/*.json`，在 `file://` 下容易被浏览器拦住。

预览正式版：

```bash
./preview-local.sh docs
```

然后在浏览器里打开：

```text
http://127.0.0.1:4173/docs/
```

预览草稿版：

```bash
./preview-local.sh draft
```

然后在浏览器里打开：

```text
http://127.0.0.1:4173/开发/web/
```

## 推荐修改流程

1. 把正式版同步到草稿区：

```bash
./sync-docs-to-draft.sh
```

2. 在 `开发/web` 里改内容，并用草稿预览地址查看效果

3. 确认没问题后，发布回正式版：

```bash
./publish-draft-to-docs.sh
```

4. 最后再预览一次 `docs/`，确认准备提交

如果 4173 端口被占用，也可以自己指定端口：

```bash
./preview-local.sh docs 8080
```

## GitHub Pages

仓库推到 GitHub 后，可在仓库 `Settings -> Pages` 中选择：

- Source：`Deploy from a branch`
- Branch：你的主分支
- Folder：`/docs`

## 说明

- GitHub Pages 版本默认不接统计接口
