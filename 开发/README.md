# 开发目录说明

这个目录现在作为本地草稿区使用，不直接发布到 GitHub Pages。

## 目录分工

- `开发/web`：本地草稿版，适合先试样式、文案、交互
- `开发/server`：本地试玩时用的轻量数据目录
- `docs/`：唯一正式发布版，推到 GitHub 后由 Pages 使用

## 推荐流程

1. 先把正式版同步到草稿区：

```bash
./sync-docs-to-draft.sh
```

2. 预览草稿区并修改：

```bash
./preview-local.sh draft
```

打开：

```text
http://127.0.0.1:4173/开发/web/
```

3. 草稿确认没问题后，发布回正式版：

```bash
./publish-draft-to-docs.sh
```

4. 再预览正式版确认一次：

```bash
./preview-local.sh docs
```

## 提醒

- `docs/` 始终是唯一正式版本
- `开发/web` 可以随便试，但提交前最好先同步回 `docs/`
