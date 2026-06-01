# GitHub Pages 版本

这个目录是给 GitHub Pages 用的静态发布目录，也是唯一正式版本。

## 本地预览

请在项目根目录运行：

```bash
./preview-local.sh docs
```

然后访问：

```text
http://127.0.0.1:4173/docs/
```

不要直接双击 `docs/index.html`，否则页面里的数据文件请求可能会被浏览器拦住，出现“加载失败”。

## 用法

1. 把整个项目推到 GitHub 仓库
2. 在仓库设置里打开 Pages
3. Source 选择 `Deploy from a branch`
4. Branch 选择你的发布分支
5. Folder 选择 `/docs`

## 访问路径

- 首页：`/`
- 数据面板：`/admin.html`

说明：

- 这版默认不接入统计接口
- GitHub Pages 作为静态发布链接
