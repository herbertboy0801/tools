# 距离和时间计算器 - 开发计划

**项目目标：** 创建一个HTML工具，允许用户输入一个起始地点和多个目标地点，然后使用Google Maps MCP计算并显示到各个目标地点的驾车距离和时间，并在页面上展示地图。

**文件夹名称：** `distance-calculator`

**核心功能点：**

1.  **用户输入界面：**
    *   一个文本框用于输入起始地点。
    *   一个或多个文本框（或动态添加的文本框）用于输入目标地点。
    *   一个“计算”按钮来触发计算过程。
2.  **地图显示：**
    *   一个区域用于显示地图，可视化起始点和目标点，以及可能的路线。
3.  **结果展示：**
    *   以列表形式清晰展示从起始点到每个目标地点的驾车距离和预计时间。
4.  **后端交互：**
    *   使用 `google-maps` MCP 的 `maps_distance_matrix` 工具来获取距离和时间数据。

**计划步骤：**

1.  **创建项目结构：**
    *   在VS Code工作区 (`d:/code/VScode`) 下创建名为 `distance-calculator` 的文件夹。
    *   在该文件夹内创建以下基础文件：
        *   `index.html`: 工具的主页面，包含UI元素。
        *   `style.css`: 用于页面的基本样式。
        *   `script.js`: 包含所有JavaScript逻辑。
        *   `README.md`: 项目说明文件。

2.  **设计 HTML 结构 (`index.html`)：**
    *   **头部信息：** 设置页面标题，链接到 `style.css`。
    *   **输入区域：**
        *   一个 `div` 容器。
        *   一个 `label` 和 `input` (type="text") 用于起始地点。
        *   一个 `div` 容器用于动态添加/管理目标地点输入框。至少包含一个初始的 `input` (type="text") 用于第一个目标地点，以及一个“添加更多目的地”的按钮。
        *   一个 `button` (例如，ID为 `calculateBtn`) 用于触发行程计算。
    *   **地图区域：**
        *   一个 `div` (例如，ID为 `mapPlaceholder`) 用于显示地图。
    *   **结果区域：**
        *   一个 `div` (例如，ID为 `resultsList`) 用于以列表形式显示每个目的地的距离和时间。
    *   **脚本链接：** 在 `</body>` 标签前链接到 `script.js`。

3.  **设计 CSS 样式 (`style.css`)：**
    *   为页面主体、输入区域、地图区域和结果列表提供基本的布局和样式。

4.  **编写 JavaScript 逻辑 (`script.js`)：**
    *   **事件监听器：**
        *   为“计算”按钮添加点击事件监听器。
        *   为“添加更多目的地”按钮添加点击事件监听器。
    *   **获取用户输入函数。**
    *   **与 Google Maps MCP 交互函数 (使用 `maps_distance_matrix`，模式为 "driving")。**
    *   **处理 MCP 响应函数。**
    *   **更新结果列表函数。**
    *   **更新地图显示函数 (初步占位)。**
    *   **错误处理。**

**Mermaid 流程图：**

```mermaid
graph TD
    subgraph 用户界面 (index.html)
        A[用户输入起始点] --> C;
        B[用户输入一个或多个目标点] --> C;
        C{点击“计算”按钮} --> D[JS: 获取所有输入地址];
    end

    subgraph JavaScript逻辑 (script.js)
        D --> E{输入有效性检查};
        E -- 有效 --> F[构造 MCP 请求: maps_distance_matrix];
        E -- 无效 --> G[显示输入错误提示];
        F --> H{调用 Google Maps MCP};
    end

    subgraph Google Maps MCP
        H -- 请求 --> I[google-maps/maps_distance_matrix 工具];
        I -- 响应 (距离/时间数据) --> J;
    end

    subgraph JavaScript逻辑 (script.js)
        J[JS: 处理MCP响应数据] --> K{数据处理成功?};
        K -- 是 --> L[JS: 更新结果列表 (显示距离/时间)];
        K -- 是 --> M[JS: 更新地图显示 (初步占位或静态图)];
        K -- 否 --> N[JS: 显示API错误或无结果提示];
    end

    subgraph 用户界面 (index.html)
        L --> O[结果区域显示列表];
        M --> P[地图区域显示内容];
        G --> Q[界面提示用户];
        N --> Q;
    end