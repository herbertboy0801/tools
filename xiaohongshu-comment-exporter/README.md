# 小红书评论导出工具

这是一个Chrome浏览器扩展，用于从任何小红书笔记页面抓取所有评论并将其导出为JSON文件。

## 更新日志

### 2025-07-04
- **修复**: 修复了因小红书页面结构更新导致的滚动抓取失败问题。现在脚本能精确找到正确的滚动容器 (`.note-scroller`)，确保可以完整抓取所有评论。
- **优化**: 改进了抓取完成前的检查机制。在滚动到底部后，脚本会进行多次最终检查，以确保所有延迟加载的评论和回复都被完整捕获，解决了评论抓取不全的问题。