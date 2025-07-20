/**
 * 将分析结果渲染到指定的 DOM 容器中
 * @param {HTMLElement} container - 用于显示报告的 DOM 元素
 * @param {Array<Object>} hotspots - 分析出的热点数组
 * @param {Array<Object>} allMessages - 所有的消息记录，用于展示完整对话
 */
function renderReport(container, hotspots, allMessages) {
    container.innerHTML = ''; // 清空之前的内容

    if (hotspots.length === 0) {
        container.innerHTML = '<p>未发现明显的讨论热点。您可以尝试调整分析参数。</p>';
        return;
    }

    const summaryEl = document.createElement('div');
    summaryEl.className = 'report-summary';
    summaryEl.innerHTML = `<h3>分析概要</h3><p>共发现 ${hotspots.length} 个讨论热点。</p>`;
    container.appendChild(summaryEl);

    hotspots.forEach((hotspot, index) => {
        const hotspotEl = document.createElement('div');
        hotspotEl.className = 'hotspot-item';
        hotspotEl.innerHTML = `
            <div class="hotspot-header">
                <h4>热点 ${index + 1}: ${formatTime(hotspot.startTime)} - ${formatTime(hotspot.endTime)}</h4>
                <p>消息总数: ${hotspot.messageCount} 条</p>
                <button class="toggle-details-btn">查看详情</button>
                <button class="ai-analyze-btn" data-hotspot-index="${index}">AI 智能分析</button>
            </div>
            <div class="hotspot-details" style="display: none;">
                ${renderMessages(hotspot.messages)}
            </div>
            <div class="ai-result-container" id="ai-result-${index}"></div>
        `;
        container.appendChild(hotspotEl);
    });

    // 添加事件监听
    addEventListeners(container);
}

/**
 * 渲染单个消息列表
 * @param {Array<Object>} messages - 消息数组
 * @returns {string} - HTML 字符串
 */
function renderMessages(messages) {
    return messages.map(msg => `
        <div class="message">
            <span class="message-user">${escapeHtml(msg.user)}</span>
            <span class="message-time">${formatTime(msg.timestamp, true)}</span>
            <div class="message-content">${escapeHtml(msg.content).replace(/\n/g, '<br>')}</div>
        </div>
    `).join('');
}

/**
 * 为报告中的交互元素添加事件监听
 * @param {HTMLElement} container 
 */
function addEventListeners(container) {
    container.addEventListener('click', function(event) {
        if (event.target.classList.contains('toggle-details-btn')) {
            const details = event.target.parentElement.nextElementSibling;
            const button = event.target;
            
            if (details.style.display === 'none') {
                details.style.display = 'block';
                button.textContent = '收起详情';
            } else {
                details.style.display = 'none';
                button.textContent = '查看详情';
            }
        }
    });
}

/**
 * 格式化时间
 * @param {Date} date - 日期对象
 * @param {boolean} showSeconds - 是否显示秒
 * @returns {string} - 格式化后的时间字符串
 */
function formatTime(date, showSeconds = false) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    if (showSeconds) {
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }
    return `${hours}:${minutes}`;
}

/**
 * HTML 特殊字符转义
 * @param {string} text 
 * @returns {string}
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}