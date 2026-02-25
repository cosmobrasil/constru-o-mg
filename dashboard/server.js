const express = require('express');
const path = require('path');
// Import functions
const apiFunction = require('./netlify/functions/api');
const analyzeFunction = require('./netlify/functions/analyze');

// Load env vars
const dotenv = require('dotenv');
const result = dotenv.config({ path: path.resolve(__dirname, '.env') });

if (result.error) {
  console.error('Erro ao carregar .env:', result.error);
} else {
  console.log('Environment loaded from:', path.resolve(__dirname, '.env'));
  const key = process.env.OPENAI_API_KEY;
  console.log('Server API Key Check:', key ? key.substring(0, 10) + '...' : 'MISSING');
}

const app = express();
const PORT = 8888;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock Netlify Function context
const context = {};

// API Route
app.get('/.netlify/functions/api', async (req, res) => {
    try {
        const result = await apiFunction.handler({}, context);
        res.status(result.statusCode).set(result.headers || {}).send(result.body);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// Analyze Route
app.post('/.netlify/functions/analyze', async (req, res) => {
    try {
        const event = {
            httpMethod: 'POST',
            body: JSON.stringify(req.body)
        };
        const result = await analyzeFunction.handler(event, context);
        res.status(result.statusCode).send(result.body);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Servidor local rodando em http://localhost:${PORT}`);
});
