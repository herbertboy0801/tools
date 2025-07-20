### **项目计划：小红书评论抓取浏览器插件 (`xiaohongshu-comment-exporter`)**

#### **1. 项目概述 (Project Overview)**

**项目名称:** `xiaohongshu-comment-exporter`

**目标:** 创建一个浏览器插件，能够注入一个控制面板到小红书的笔记页面中。用户通过该面板可以一键抓取当前笔记下的所有评论，并能将抓取到的数据（包括用户昵称、评论内容、点赞数、评论时间）以 JSON 格式导出到本地。

#### **2. 核心功能 (Core Features)**

1.  **UI 注入:** 在小红书笔记页面 ([`https://www.xiaohongshu.com/explore/...`](https://www.xiaohongshu.com/explore/...)) 动态创建一个浮动控制面板。
2.  **数据显示:** 控制面板上实时显示抓取状态和统计数据（评论数量、最高点赞、平均点赞）。
3.  **评论抓取:**
    *   点击“抓取评论”按钮。
    *   插件自动向下滚动页面，以确保所有评论都被加载出来。
    *   从页面的 DOM 结构中解析并提取每条评论的指定字段。
4.  **数据导出:**
    *   点击“导出数据到本地 (JSON)”按钮。
    *   将抓取到的评论数据转换成 JSON 格式。
    *   自动触发浏览器下载，将 JSON 文件保存到用户本地。

#### **3. 技术选型 (Technical Stack)**

*   **语言:** HTML, CSS, JavaScript (ES6+)
*   **平台:** 浏览器插件 (主要针对 Chrome / Edge 等 Chromium 内核浏览器)
*   **核心API:** 标准 Web API, Browser Extension APIs (`chrome.tabs`, `chrome.scripting`)

#### **4. 项目文件结构 (File Structure)**

```
xiaohongshu-comment-exporter/
├── manifest.json         # 插件的核心配置文件
├── popup/
│   ├── popup.html        # 插件图标点击后显示的弹出页面UI
│   └── popup.js          # 弹出页面的逻辑
├── content/
│   ├── content_script.js # 注入到小红书页面的核心脚本
│   └── content_style.css # 注入UI的样式
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── PLAN.md               # 我们正在讨论的这份计划文件
└── README.md             # 项目说明和使用指南
```

#### **5. 开发步骤 (Development Plan)**

**阶段一：项目基础搭建**
1.  创建 `xiaohongshu-comment-exporter` 文件夹及上述文件结构。
2.  编写基础的 `manifest.json` 文件，定义插件名称、版本、权限（如 `activeTab`, `scripting`）和内容脚本的匹配规则。

**阶段二：UI 界面开发**
1.  在 `content_script.js` 中编写代码，用于在小红书页面动态创建和注入控制面板的 HTML 结构，参考图片中的样式。
2.  在 `content_style.css` 中编写样式，美化注入的控制面板，使其清晰、易用且不影响原页面浏览。
3.  开发 `popup.html`，用于在用户点击浏览器工具栏图标时，提供简单的提示信息（例如：“请先打开一个小红书笔记页面”）。

**阶段三：核心抓取逻辑实现**
1.  在 `content_script.js` 中为“抓取评论”按钮绑定点击事件。
2.  实现自动滚动函数，通过 `window.scrollTo()` 模拟用户滚动，直到页面底部，确保所有评论都已加载。
3.  分析小红书评论区的 DOM 结构，编写选择器来定位每条评论的容器以及内部的用户名、内容、点赞数和时间等元素。
4.  编写循环和解析逻辑，将提取到的数据整理成一个对象数组（Array of Objects）。
5.  将抓取到的数据存储在脚本的变量中，并更新UI上的统计信息。

**阶段四：数据导出功能**
1.  在 `content_script.js` 中为“导出数据到本地 (JSON)”按钮绑定点击事件。
2.  编写函数将存储评论数据的对象数组通过 `JSON.stringify()` 转换为字符串。
3.  利用 `Blob` 和 `URL.createObjectURL()` 创建一个可下载的文件链接，并模拟点击该链接，触发浏览器下载。

**阶段五：文档和打包**
1.  编写 `README.md`，详细说明插件的功能、如何在开发者模式下加载插件以及使用步骤。
2.  准备最终的图标文件。

#### **6. 工作流程图 (Workflow Diagram)**

```mermaid
graph TD
    A[用户打开小红书笔记页面] --> B{插件自动注入UI面板};
    B --> C[用户点击“抓取评论”];
    C --> D[脚本开始自动滚动页面];
    D --> E{判断是否已滚动到底部};
    E -- 否 --> D;
    E -- 是 --> F[开始解析DOM，提取评论数据];
    F --> G[将数据存入JS数组];
    G --> H[在UI上更新评论总数等统计信息];
    H --> I[用户点击“导出JSON”];
    I --> J[生成JSON数据并创建下载链接];
    J --> K[浏览器自动下载.json文件];
    K --> L[任务完成];