const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const HOST = '0.0.0.0';
const PORT = process.env.PORT || 3000;
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'gemma4:e2b';

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJson(res, 500, { error: 'Failed to load page.' });
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

async function classifyText(text) {
  const prompt = [
    'You are a text classifier for a website.',
    'Classify the input into exactly ONE category from this list:',
    'feedback, support_ticket, content_tagging, other',
    'Return only the category label with no explanation.',
    `Input: ${text}`
  ].join('\n');

  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: { temperature: 0 }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`);
  }

  const data = await response.json();
  const raw = String(data.response || '').trim().toLowerCase();
  const allowed = new Set(['feedback', 'support_ticket', 'content_tagging', 'other']);
  if (allowed.has(raw)) {
    return raw;
  }

  const normalized = raw.replace(/[^a-z_]/g, '');
  if (allowed.has(normalized)) {
    return normalized;
  }

  return 'other';
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    return sendFile(res, path.join(__dirname, 'public', 'index.html'), 'text/html; charset=utf-8');
  }

  if (req.method === 'POST' && req.url === '/api/classify') {
    try {
      const body = await parseBody(req);
      const text = String(body.text || '').trim();

      if (!text) {
        return sendJson(res, 400, { error: 'Text is required.' });
      }

      const category = await classifyText(text);
      return sendJson(res, 200, { category });
    } catch (error) {
      return sendJson(res, 500, {
        error: 'Classification failed. Ensure Ollama is running and gemma4:e2b is available.',
        details: error.message
      });
    }
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
