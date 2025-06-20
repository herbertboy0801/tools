# 动态多停靠点路线规划器 (Google Maps)

## 概述

本项目 (`schedule.html`) 是一个基于 Web 的工具，允许用户输入起点、终点和多个途经点，然后使用 Google Maps API 计算和显示优化的驾车路线。它提供了详细的路线信息，包括总距离、总驾驶时间、停靠点信息以及包含停靠时间的总估算时间。该工具还具有动态添加/删除途经点、地址输入建议以及清晰的路线概览等功能。

## 主要功能

- **动态路线规划**:
    - 支持输入起点、可选的多个途经点以及终点。
    - 使用 Google Maps API (`DirectionsService`) 计算最佳驾车路线，并始终尝试优化途经点顺序 (`optimizeWaypoints: true`)。
- **详细路线信息**:
    - 在地图上可视化显示规划的路线 (`DirectionsRenderer`)。
    - 提供文本格式的逐步导航指示。
    - 显示路线总距离。
    - 显示总预计驾驶时间。
    - 用户可以为每个途经点设置停留时间。
    - 计算并显示包含所有停靠点停留时间的总行程估算时间。
- **用户友好的输入界面**:
    - **起点和终点**: 明确的输入框；终点地址默认为起点，但用户可修改。
    - **动态途经点**: 用户可以通过 "+" 按钮动态添加任意数量的途经点输入框，并通过 "-" 按钮移除。
    - **字母标记 (A, B, C...)**: 起点、途经点和终点在输入区域会动态显示字母标记（A为起点，B,C...为途经点，终点若与起点相同则为A，否则为序列末尾字母），方便用户识别。
    - **地址输入建议**:
        - 所有地址输入框（起点、终点、途经点）均提供预设地址的下拉建议。
        - 系统会自动“学习”用户成功规划路线时使用的新地址，并将其添加到后续的建议列表中。
- **清晰的结果呈现**:
    - **优化路线概览**: 在详细导航步骤上方，会以列表形式清晰展示优化后的完整路线顺序，使用字母标记和对应的完整地址（例如：`A (地址A) → C (地址C)`，每个路段占一行）。
    - **总结信息面板**: 显示总距离、总驾驶时间、停靠点数量、总停靠时间以及包含停靠的总估算时间。

## 技术栈

- HTML5
- CSS3 (部分内联样式，部分通过 `schedule-style.css`)
- JavaScript (ES6+)
- Google Maps JavaScript API (Directions API, Maps JavaScript API, Places Library, Geometry Library)

## 如何设置和使用

1.  **获取文件**: 下载或克隆本仓库/项目文件。
2.  **获取 Google Maps API 密钥**:
    - 您需要一个有效的 Google Maps API 密钥。
    - 在 Google Cloud Console 中，确保您的项目已启用以下 API：
        - **Maps JavaScript API**
        - **Directions API**
        - (可选，但建议启用以便未来扩展或某些功能如地址自动完成) **Places API**
3.  **配置 API 密钥**:
    - 打开 `schedule.html` 文件。
    - 找到文件末尾的以下行：
      ```html
      <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCt9E-S7_tBPg-QDtoL_Im50BtzdZ5LlJI&callback=initMap&libraries=places,geometry"></script>
      ```
    - 将 `AIzaSyCt9E-S7_tBPg-QDtoL_Im50BtzdZ5LlJI` 替换为您自己的有效 API 密钥。
4.  **运行**:
    - 在现代的 Web 浏览器中直接打开 `schedule.html` 文件。
5.  **使用方法**:
    - **输入起点**: 在标有 "A" 的“起点地址”框中输入。
    - **输入终点**: 在“终点地址”框中输入。如果留空或与起点相同，它将自动使用起点地址。其字母标记会相应更新。
    - **添加途经点**: 点击 "+" 按钮添加途经点输入框。每个途经点将按顺序标记为 "B", "C" 等。使用 "-" 按钮移除途经点。
    - **输入停靠时间**: 在“每个停靠点停留时间 (分钟)”框中输入希望在每个途经点停留的时间。
    - **计算路线**: 点击“计算路线”按钮。
    - **查看结果**:
        - 地图将显示优化后的路线。
        - “优化后的路线概览”部分将以字母标记和地址显示路线概览。
        - “路线规划结果”部分将显示总距离、时间等详细信息。
        - 详细的文本导航步骤会显示在导航面板中。

## 项目文件

- `schedule.html`: 应用程序的主要 HTML 文件，包含结构、内联样式和所有 JavaScript 逻辑。
- `schedule-style.css`: 包含一些用于页面整体布局和组件的外部 CSS 样式。
- `README.md`: 本说明文件。
- `distance-calculator-plan.md`: (如果适用) 项目的规划文档。
- `schedule_amap.html`: (可选提及) 一个使用高德地图API的备用实现版本（请注意：此版本在处理特定区域地址时可能存在局限性，当前主要维护和推荐使用的是 `schedule.html` 的Google Maps版本）。

## 注意事项

- 请确保您的 Google Maps API 密钥配置正确且具有所需的 API 权限。
- 路线规划的准确性和可用性取决于 Google Maps API 的服务。
- 地址输入建议功能会学习您成功规划过的路线中的地址。此“学习”数据存储在浏览器会话中，刷新页面后建议列表会重置为初始预设值和本次会话中新学习到的地址（注：当前未实现持久化存储到localStorage，若需要请自行添加）。

---

*(建议您在 GitHub 仓库中添加一张应用程序界面的截图，以更直观地展示其功能。)*