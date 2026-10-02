# 机研学社 · Mech to Robotics Lab

面向机械工程学生的机器人学习工作台：用中文视频学习基础课程，用实践任务记录进度，用可连线的个人路线记录自己的成长顺序。

纯 HTML、CSS 和 JavaScript，无运行依赖、无账号系统、无后端。可以本地运行，也可以部署到 GitHub Pages 或其他静态托管服务。

## 主要功能

- **课程地图**：33 门课程，90 个中文视频资源，主要来自中国大学 MOOC 和 B站。支持课程、知识点、讲师、视频来源搜索，以及类别、状态和先修条件筛选。
- **我的学习**：集中显示学习中、已暂停、已掌握的课程。可以加入、取消和重新加入；取消不清除知识任务或笔记。
- **成长路线**：四个学习阶段与首推七步参考路线，连接机械、嵌入式、控制、ROS 2、感知和导航。
- **个人路线画布**：课程与自定义模块、整卡拖动、方向连线、分支汇合、布局整理、缩放和平移；可以记录学习心得。
- **项目实践**：支架设计、电机闭环、视觉测量、机械臂仿真和 ROS 2 导航五类综合任务。
- **笔记与进度**：保存在当前浏览器，不要求注册账户。

界面采用石墨深灰：背景 `#262626`、面板 `#393939`、文字 `#F4F4F4`、强调色 `#78A9FF`。

## 快速开始

需要 Node.js 20 或更高版本。下载仓库 ZIP 并解压，在项目根目录运行：

```bash
npm run dev
```

浏览器打开 **http://127.0.0.1:4173**。没有第三方依赖，不需要先运行 `npm install`。

也可以使用 Python：

```bash
python -m http.server 4173 --bind 127.0.0.1 --directory web
```

建议通过 HTTP 打开；直接双击 HTML 的 `file://` 地址，其存储行为取决于浏览器。停止本地服务按 `Ctrl+C`。

## 怎么使用

1. 在课程地图打开一门课程，选择适合自己的中文视频。
2. 点击“加入学习中”，到侧栏“我的学习 → 学习中”查看。
3. 根据实际掌握情况勾选知识任务。全部完成后自动进入“已掌握”。
4. 取消学习中时，部分完成的课程进入“已暂停”；没有进度的回到“未开始”，笔记仍保留。
5. 在“成长路线 → 我的个人路线”添加课程或自定义模块，从右侧圆点连接到下一模块左侧圆点。学习中列表与路线节点分别管理。
6. 拖动模块任意位置调整布局；用按钮或 `Ctrl + 滚轮` 缩放，拖动画布空白处平移。

## 项目结构

```text
mech-to-robotics-lab/
├── web/                    # 可直接部署的静态网站
│   ├── index.html          # 页面入口与导航
│   ├── style.css           # 主题、布局与响应式样式
│   ├── data.js             # 课程、视频、项目、参考来源
│   ├── app.js              # 页面、课程状态、笔记与进度
│   └── personal-route.js   # 个人路线编辑器
├── scripts/serve.mjs        # 无依赖的本地静态服务
├── docs/                   # 资源清单、架构与发布说明
├── .github/                # Issue 模板、可手动运行的 Pages 发布流程
├── package.json
├── CONTRIBUTING.md
├── SECURITY.md
├── THIRD_PARTY_NOTICES.md
├── CHANGELOG.md
└── LICENSE
```

编辑 `web/` 即可开发，不需要编译或打包；部署时只上传 `web/` 中的内容。

## 数据与隐私

学习数据保存在浏览器 localStorage，**不会随 Git 仓库上传**。源码中只有课程资源与界面逻辑，没有用户笔记、进度或个人路线实例。

| 保存内容 | 存储键 |
| --- | --- |
| 课程任务、学习状态、笔记与项目完成状态 | `mech-robotics-learning-v1` |
| 个人路线节点、连线、心得、位置与缩放 | `mech-robotics-personal-route-v1` |

不同设备、浏览器和网站来源的记录独立；更换部署地址不会自动迁移原网站的记录。清除站点数据会删除记录，当前版本没有导入、导出或云同步功能。存储失败时页面会提示。

站内使用的图片标志是内嵌 SVG，默认应用不加载第三方字体或统计脚本。视频通过外链在原平台观看。支持的浏览器可能提供 WebMCP：读取课程及更新知识任务；普通浏览器没有该接口时仍可正常使用。

## 部署与维护

- [部署与 GitHub 上传说明](docs/deployment.md)
- [架构、状态规则与数据兼容](docs/architecture.md)
- [中文视频资源清单](docs/resources.zh-CN.md)
- [贡献指南](CONTRIBUTING.md)
- [版本记录](CHANGELOG.md)

已附 GitHub Pages **手动发布**工作流。上传仓库后，在 `Settings → Pages → Source` 选择 `GitHub Actions`，再到 `Actions → Deploy static site to GitHub Pages → Run workflow` 发布。工作流不包含测试或构建步骤。[GitHub 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## 资源与路线依据

课程入口以中文视频为主；开源仓库用于课程组织、算法与系统实践参考：

- [OSSU](https://github.com/ossu/computer-science)、[developer-roadmap](https://github.com/nilbuild/developer-roadmap)、[robotics-coursework](https://github.com/mithi/robotics-coursework)
- [PythonRobotics](https://github.com/AtsushiSakai/PythonRobotics)、[ModernRobotics](https://github.com/NxRLab/ModernRobotics)、[linorobot2](https://github.com/linorobot/linorobot2)
- [Hello 算法](https://github.com/krahets/hello-algo)、[STM32CubeF1](https://github.com/STMicroelectronics/STM32CubeF1)

七步推荐路线还参考了密歇根大学机器人课程、Modern Robotics 教材、古月居、ROS 2 和 Nav2 官方资料；原始链接保留在网站中。路线为本项目综合编排，可以按基础和学校培养方案调整。

视频热度、评分、参课人数是检索快照，非实时统计，也不构成全站排名。课程观看条件、开课学期和软件版本以原平台为准。资源清单快照日期为 2026-10-01，推荐路线整理日期为 2026-10-02。

## 许可证

本项目原创代码与原创说明采用 [MIT License](LICENSE)，版权署名为 `Waters-space and contributors`。第三方课程、视频、文档、项目代码、商标及产品名称不因外链收录而变更许可，详见 [第三方来源说明](THIRD_PARTY_NOTICES.md)。

本次开源整理保留了最新功能，完成文件范围与敏感内容检查，未运行浏览器交互测试或逐条播放外部视频。原托管平台的私有访问范围与后台计划不会随仓库或部署配置迁移。
