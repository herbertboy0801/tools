const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3000;

// --- 配置区 ---
// 在实际部署中，强烈建议使用环境变量来存储 API Key
const AI_API_KEY = process.env.AI_API_KEY || "YOUR_AI_API_KEY_HERE";
const AI_API_ENDPOINT = process.env.AI_API_ENDPOINT || "https://api.example.com/v1/chat/completions";

app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析 JSON 请求体

// 定义 API 路由
app.post('/api/analyze', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: '请求体中缺少文本内容 (text)。' });
    }

    if (AI_API_KEY === "YOUR_AI_API_KEY_HERE") {
        return res.status(500).json({ error: '服务器尚未配置 AI API Key。' });
    }

    try {
        // 构建发送给 AI 服务的请求
        const aiResponse = await axios.post(
            AI_API_ENDPOINT,
            {
                // 这里是请求体，具体结构取决于您使用的 AI 服务
                // 例如，对于 OpenAI GPT 系列模型：
                model: "gpt-4-turbo", // 建议使用更强大的模型以获得更好的JSON输出
                messages: [
                    {
                        role: "system",
                        content: `你是一个顶级的聊天记录分析专家。请分析以下聊天记录，并严格按照下面的JSON格式返回你的分析结果，不要有任何多余的解释：
{
  "topic": "总结这次讨论的核心议题是什么",
  "conclusion": "总结讨论得出了哪些关键结论或下一步行动",
  "sentiment": "分析这段对话的整体情感倾向 (例如: 积极, 消极, 中立, 激烈讨论等)",
  "keywords": ["提取3-5个核心关键词"]
}`
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                response_format: { "type": "json_object" }, // 强制要求返回JSON对象
                temperature: 0.5,
            },
            {
                headers: {
                    'Authorization': `Bearer ${AI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // 将 AI 服务返回的 JSON 字符串解析后，再返回给前端
        const resultJson = JSON.parse(aiResponse.data.choices[0].message.content);
        res.json(resultJson);

    } catch (error) {
        console.error('调用 AI 服务时出错:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: '调用 AI 服务时发生内部错误。' });
    }
});

app.listen(port, () => {
    console.log(`AI 代理服务器正在 http://localhost:${port} 上运行`);
});