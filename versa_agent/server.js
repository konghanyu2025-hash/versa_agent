require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// 配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API路由
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, temperature = 0.7, jsonMode = false } = req.body;

        if (!DEEPSEEK_API_KEY) {
            return res.status(500).json({ error: '服务器未配置API Key' });
        }

        const body = {
            model: 'deepseek-chat',
            messages: messages,
            temperature: temperature
        };

        if (jsonMode) {
            body.response_format = { type: 'json_object' };
        }

        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            return res.status(response.status).json({ error: error.error?.message || 'API调用失败' });
        }

        const data = await response.json();
        res.json({ content: data.choices[0].message.content });

    } catch (error) {
        console.error('API调用失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', configured: !!DEEPSEEK_API_KEY });
});

// 默认路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`VersaAgent服务已启动: http://localhost:${PORT}`);
    if (!DEEPSEEK_API_KEY) {
        console.log('警告: 未设置DEEPSEEK_API_KEY环境变量');
    }
});
