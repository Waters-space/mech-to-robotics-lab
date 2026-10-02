# 上传 GitHub 与部署

整理日期：2026-10-02。建议仓库名为 `mech-to-robotics-lab`，可使用自己的名称。当前目录是整理好的源码快照，不包含原托管仓库的 Git 历史。

## 上传 GitHub

### 方式一：GitHub Desktop

1. 在 GitHub 创建公开仓库。若准备从本地 Git 推送，保持空仓库，不额外初始化 README、LICENSE 或 gitignore。
2. 在解压后的项目目录初始化 Git：

   ```bash
   git init -b main
   git add .
   git commit -m "Initial open-source release"
   ```

   若 Git 提示缺少作者信息，配置你自己的姓名和提交邮箱，或 GitHub 提供的 noreply 邮箱。
3. 在 GitHub Desktop 添加这个本地仓库，使用你的 GitHub 账户发布为公开仓库。

### 方式二：Git 命令行

在空 GitHub 仓库的页面复制 HTTPS 或 SSH 地址，然后执行：

```bash
git init -b main
git add .
git commit -m "Initial open-source release"
git remote add origin <你刚创建的仓库地址>
git push -u origin main
```

先完成 GitHub 身份认证。不要把 token 放在 URL、命令历史或项目文件里。遇到已有文件或分支冲突，先检查远端，不强制覆盖。

### 方式三：网页上传

在仓库 `Add file → Upload files` 上传**解压后的目录内容**，不是上传 ZIP 文件本身。确认 `.github/workflows/pages.yml`、`.gitignore` 等点开头的文件也已包含；若浏览器不接受隐藏目录，用 GitHub Desktop 或 Git 命令行。

上传步骤依据 [GitHub 官方：添加本地代码](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)。

## GitHub Pages

网站源文件全部在 `web/`，不需要构建。已有工作流只通过手动运行发布，不会因提交说明文件而自动公开网站。

1. 上传源码至仓库默认分支。
2. 在仓库 `Settings → Pages`，将 `Source` 设为 `GitHub Actions`。
3. 打开 `Actions → Deploy static site to GitHub Pages`，点击 `Run workflow`。
4. 以该次 workflow 的部署结果为准，成功后从 `github-pages` 环境或 Pages 设置取得网址。

配置包含 checkout、configure-pages、upload-pages-artifact 和 deploy-pages；只上传 `web/`。可按实际需要另行加入 push 触发器。[GitHub 官方工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

项目使用相对资源路径与 hash 路由，不需要设置项目子路径，也不需要服务器路由重写。

## 其他静态托管

将 `web/` 的内容作为发布目录上传，保持 `index.html` 与 JS、CSS 在同一级。无需密钥、服务端变量、数据库或原托管平台 SDK。

## 更换网址后的学习数据

浏览器按 origin 保存 localStorage，换域名不会自动迁移原记录。同一域名下的不同路径可能共享这些保存键；需要同源运行多个独立实例时，先设计数据迁移与命名空间，避免直接覆盖现有键。

当前版本没有自动导入、导出、云同步。仓库发布和静态部署只发布程序，不会同步你的私人学习记录。原网站的访问限制与后台定期优化任务也不会自动迁移。

## 更新项目

修改 `web/`，提交并推送后重新运行 Pages 工作流。课程 ID、知识任务索引、localStorage 键和个人路线 ID 关系涉及旧数据兼容，修改前阅读 [架构说明](architecture.md)。
