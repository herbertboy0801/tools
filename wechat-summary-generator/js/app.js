document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('chatfile');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loadSampleBtn = document.getElementById('load-sample-btn');
    const reportContainer = document.getElementById('report-container');
    const settingsPanel = document.getElementById('settings-panel');

    /**
     * 核心处理函数：接收文本内容，执行分析并渲染报告
     * @param {string} fileContent - 聊天记录的文本内容
     */
    function processChatLog(fileContent) {
        // 1. 解析聊天记录
        const messages = parseChat(fileContent);
        if (messages.length === 0) {
            alert('解析失败或文件内容为空！');
            return;
        }

        // 显示设置面板，用于未来的 AI 功能
        settingsPanel.style.display = 'block';

        // 2. 分析热点
        const hotspots = analyzeHotspots(messages);

        // 3. 渲染报告
        renderReport(reportContainer, hotspots, messages);
    }

    // 事件监听：点击 "开始分析" 按钮
    analyzeBtn.addEventListener('click', () => {
        const file = fileInput.files[0];
        if (!file) {
            alert('请先选择一个 .txt 文件！');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            processChatLog(event.target.result);
        };
        reader.onerror = function() {
            alert('读取文件时发生错误！');
        };
        reader.readAsText(file, 'UTF-8');
    });

    // 事件监听：点击 "加载示例记录" 按钮
    loadSampleBtn.addEventListener('click', () => {
        if (typeof sampleChatLog !== 'undefined') {
            processChatLog(sampleChatLog);
        } else {
            alert('示例聊天记录加载失败！');
        }
    });

    /**
     * 调用后端 AI 分析 API
     * @param {string} text - 要分析的文本
     * @param {number} index - 热点的索引
     */
    async function callAIAnalysisAPI(text, index) {
        const resultContainer = document.getElementById(`ai-result-${index}`);
        resultContainer.innerHTML = '<p>AI 正在分析中，请稍候...</p>';
        
        try {
            const response = await fetch('http://localhost:3000/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'AI 服务返回错误');
            }

            const data = await response.json();
            
            // 使用新的 JSON 结构来构建更丰富的 HTML
            const summaryHtml = `
                <div class="ai-summary-card">
                    <h4>AI 深度分析</h4>
                    <div class="ai-summary-item">
                        <strong>核心议题:</strong>
                        <p>${escapeHtml(data.topic)}</p>
                    </div>
                    <div class="ai-summary-item">
                        <strong>关键结论:</strong>
                        <p>${escapeHtml(data.conclusion)}</p>
                    </div>
                    <div class="ai-summary-item">
                        <strong>情感倾向:</strong>
                        <span class="sentiment-tag">${escapeHtml(data.sentiment)}</span>
                    </div>
                    <div class="ai-summary-item">
                        <strong>关键词:</strong>
                        <div class="keywords-container">
                            ${data.keywords.map(kw => `<span class="keyword-tag">${escapeHtml(kw)}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `;
            resultContainer.innerHTML = summaryHtml;

        } catch (error) {
            resultContainer.innerHTML = `<p style="color: red;">AI 分析失败: ${error.message}</p>`;
        }
    }

    // 使用事件委托来处理所有 "AI 智能分析" 按钮的点击
    reportContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('ai-analyze-btn')) {
            const button = event.target;
            const hotspotIndex = button.dataset.hotspotIndex;
            
            // 从已经渲染的报告中找到对应的热点消息
            // 注意：这需要我们在渲染时将消息数据暂存起来
            // 为了简化，我们先从 DOM 中重新构建文本
            const detailsDiv = button.closest('.hotspot-item').querySelector('.hotspot-details');
            const messagesText = Array.from(detailsDiv.querySelectorAll('.message'))
                .map(msgEl => {
                    const user = msgEl.querySelector('.message-user').textContent;
                    const content = msgEl.querySelector('.message-content').textContent;
                    return `${user}:\n${content}`;
                }).join('\n\n');

            callAIAnalysisAPI(messagesText, hotspotIndex);
        }
    });

    // HTML 特殊字符转义函数 (如果 renderer.js 中没有，可以在这里加一个)
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.innerText = text;
        return div.innerHTML;
    }
});