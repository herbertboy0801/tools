/**
 * 解析微信聊天记录 .txt 文件内容
 * @param {string} text - 聊天记录的完整文本内容
 * @returns {Array<Object>} - 解析后的消息对象数组
 * 
 * 消息对象的结构: { timestamp: Date, user: string, content: string }
 */
function parseChat(text) {
    const messages = [];
    if (!text) return messages;

    // 正则表达式来匹配每一行消息的开头，例如 "2024-01-01 14:30:00 张三"
    // 这个正则表达式需要能够处理日期和时间，以及可能包含空格的用户名
    const messageRegex = /^(\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}:\d{2}) (.+?)\n([\s\S]+?)(?=\n\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}:\d{2} .+\n|$)/gm;
    
    // 另一种常见的格式
    const simpleMessageRegex = /^(\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}:\d{2}) (.+?)\n/gm;


    // 首先尝试用更复杂的正则匹配包含多行内容的消息
    const lines = text.split('\n');
    let currentMessage = null;

    for (const line of lines) {
        // 尝试匹配消息头 "YYYY-MM-DD HH:mm:ss User"
        const headerMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}:\d{2}) (.+)/);

        if (headerMatch) {
            // 如果匹配到新的消息头，先将上一条消息存入数组
            if (currentMessage) {
                messages.push(currentMessage);
            }
            
            // 创建新的消息对象
            const timestampStr = headerMatch[1];
            const user = headerMatch[2].trim();
            
            // 注意：微信导出的时间可能不含秒，这里做个兼容
            const timestamp = new Date(timestampStr.length === 16 ? timestampStr + ':00' : timestampStr);

            currentMessage = {
                timestamp,
                user,
                content: ''
            };
        } else if (currentMessage) {
            // 如果不是消息头，且当前有正在处理的消息，就将这行内容追加到 content
            if (currentMessage.content) {
                currentMessage.content += '\n' + line;
            } else {
                currentMessage.content = line;
            }
        }
    }

    // 将最后一条消息存入数组
    if (currentMessage) {
        messages.push(currentMessage);
    }

    // 过滤掉一些系统消息，例如 "以上是打招呼的内容" 等
    return messages.filter(msg => msg.content && !msg.user.includes('系统消息') && !msg.content.includes('以上是打招呼的内容'));
}