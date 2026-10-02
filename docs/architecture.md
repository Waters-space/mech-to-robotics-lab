# 架构与维护约定

## 加载顺序

`index.html` 使用 defer，依次加载 `data.js → personal-route.js → app.js`。前者定义课程数据；个人路线文件提供编辑器函数；应用文件初始化课程状态并渲染当前页面。

这些文件使用普通脚本共享作用域。移动加载顺序或改成 ES Modules 时，应同时处理跨文件函数和数据引用。

## 页面

| Hash | 内容 |
| --- | --- |
| `#home` | 学习工作台、总体进度与建议课程 |
| `#learning` | 我的学习，默认显示学习中 |
| `#learning?status=paused` | 已暂停课程 |
| `#learning?status=done` | 已掌握课程 |
| `#courses` | 可搜索和筛选的课程地图 |
| `#roadmap` | 个人路线、阶段课程与底部首推路线 |
| `#projects` | 综合项目任务 |
| `#sources` | 原始参考来源 |
| `#notes` | 课程笔记 |

## 课程数据

`web/data.js` 包含 `RESOURCES`、`COURSES`、`GROUPS`、`PHASES`、`PROJECTS`、`SOURCES` 和 `RECOMMENDED_ROBOTICS_ROUTE` 等数据。

- `COURSES[].id` 是存储及跨课程引用使用的稳定 ID。
- `prereqs` 是建议先修，不限制课程访问。
- `topics` 的数组索引用于保存知识任务勾选状态。调整已有条目的顺序或删除条目可能错配旧记录。
- 资源通过主课、备选、专题补充引用；检索快照与选课依据保留在资源元数据中。

当前以浏览器自评记录表示学习成果，不进行考试或自动能力判定。

## 学习状态规则

1. 任务全部完成：`done` / 已掌握。
2. `started === false` 且有部分进度：`paused` / 已暂停。
3. `started === false` 且无任务进度：`new` / 未开始。
4. 其他有部分进度或 `started === true`：`in-progress` / 学习中。
5. 其余为未开始。

取消学习中只设置 `started: false`，不清除 checks、note 或项目记录。取消后修改知识任务保留取消状态；重新加入需要明确操作。旧数据缺省 started 时，仍按原有进度判断学习中。

## 本地数据

课程存储键：`mech-robotics-learning-v1`。

```json
{
  "courses": {
    "c": { "started": true, "checks": [true, false, false, false], "note": "", "updated": 0 }
  },
  "projects": {}
}
```

个人路线存储键：`mech-robotics-personal-route-v1`。

```json
{
  "nodes": [
    { "id": "example-node", "courseId": "c", "title": "", "x": 40, "y": 40, "learned": false, "note": "" }
  ],
  "edges": [],
  "view": { "zoom": 1 },
  "updated": null
}
```

以上为结构示例，不是某个用户的学习数据。自定义模块的 courseId 为 null，以 title 显示；连线使用 from、to 节点 ID。节点、连线、心得和缩放由个人路线编辑器保存。

节点位置使用未缩放的画布坐标；指针位置与移动距离需除以缩放倍率。CSS transform、滚动容器尺寸与 SVG 连线必须使用一致的坐标约定。

个人路线节点不会随课程加入／取消自动增删；已经完成的课程可以影响对应节点的已掌握显示。节点上的独立“学过”标记不改课程任务。

## WebMCP

浏览器存在 `document.modelContext.registerTool` 时，注册课程查询与知识任务更新工具。没有接口时不注册，常规页面不依赖它。读写范围是当前浏览器保存的课程数据，不访问云端账户数据。

## 维护边界

- 资源更新保留原始来源、快照日期、平台和版本说明；不能编造热度与认证。
- 渲染用户输入使用转义，节点标题、心得、笔记视为用户数据。
- 涉及 ID、知识任务顺序、数据形状或保存键的变化，需明确迁移策略。
- 后台更新计划不包含在开源运行环境中；资源更新由仓库维护者安排。
- 本次整理未运行测试或浏览器交互验证，不能将发布打包成功等同于交互与视频验证成功。
