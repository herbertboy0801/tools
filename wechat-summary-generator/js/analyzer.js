/**
 * 分析聊天记录，找出讨论热点
 * @param {Array<Object>} messages - 解析后的消息对象数组
 * @returns {Array<Object>} - 热点时段对象数组
 *
 * 热点对象的结构: { startTime: Date, endTime: Date, messageCount: number, messages: Array<Object> }
 */
function analyzeHotspots(messages, windowMinutes = 5, densityThreshold = 10) {
    if (messages.length < densityThreshold) {
        return [];
    }

    const hotspots = [];
    let windowStartTime = new Date(messages[0].timestamp);
    let windowStartIndex = 0;

    for (let i = 1; i < messages.length; i++) {
        const currentTime = new Date(messages[i].timestamp);
        const timeDiffMinutes = (currentTime - windowStartTime) / (1000 * 60);

        // 如果当前消息超出了时间窗口
        if (timeDiffMinutes > windowMinutes) {
            // 检查当前窗口内的消息数量是否达到热点阈值
            const messageCountInWindow = i - windowStartIndex;
            if (messageCountInWindow >= densityThreshold) {
                const hotspotMessages = messages.slice(windowStartIndex, i);
                hotspots.push({
                    startTime: new Date(messages[windowStartIndex].timestamp),
                    endTime: new Date(messages[i - 1].timestamp),
                    messageCount: messageCountInWindow,
                    messages: hotspotMessages
                });
            }
            
            // 移动窗口的起始点
            // 为了找到下一个窗口的起点，我们从旧窗口的起点开始向右移动
            let newStartFound = false;
            for (let j = windowStartIndex + 1; j <= i; j++) {
                if ((currentTime - messages[j].timestamp) / (1000 * 60) <= windowMinutes) {
                    windowStartIndex = j;
                    windowStartTime = new Date(messages[j].timestamp);
                    newStartFound = true;
                    break;
                }
            }
            if (!newStartFound) {
                 windowStartIndex = i;
                 windowStartTime = new Date(messages[i].timestamp);
            }
        }
    }

    // 检查最后一个窗口
    const lastWindowCount = messages.length - windowStartIndex;
    if (lastWindowCount >= densityThreshold) {
         const hotspotMessages = messages.slice(windowStartIndex);
         hotspots.push({
            startTime: new Date(messages[windowStartIndex].timestamp),
            endTime: new Date(messages[messages.length - 1].timestamp),
            messageCount: lastWindowCount,
            messages: hotspotMessages
        });
    }

    // TODO: 合并连续或重叠的热点
    return mergeHotspots(hotspots);
}


/**
 * 合并连续或重叠的热点时段
 * @param {Array<Object>} hotspots - 原始热点数组
 * @returns {Array<Object>} - 合并后的热点数组
 */
function mergeHotspots(hotspots) {
    if (hotspots.length <= 1) {
        return hotspots;
    }

    const merged = [];
    let currentHotspot = hotspots[0];

    for (let i = 1; i < hotspots.length; i++) {
        const nextHotspot = hotspots[i];
        // 如果下一个热点的开始时间在前一个热点的结束时间之后不久（例如10分钟内），则合并
        const gapMinutes = (nextHotspot.startTime - currentHotspot.endTime) / (1000 * 60);
        
        if (gapMinutes < 10) { // 合并阈值，可以调整
            currentHotspot.endTime = nextHotspot.endTime;
            currentHotspot.messageCount += nextHotspot.messageCount;
            currentHotspot.messages = currentHotspot.messages.concat(nextHotspot.messages);
        } else {
            merged.push(currentHotspot);
            currentHotspot = nextHotspot;
        }
    }
    merged.push(currentHotspot);

    return merged;
}