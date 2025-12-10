// Simple mock server for testing without real agent backend
const express = require('express');
const app = express();
const PORT = 8089;

app.use(express.json());

// Enable CORS for local testing
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: 'mock-1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mock chat endpoint
app.post('/api/chat', (req, res) => {
  const { messages } = req.body;
  const lastMessage = messages[messages.length - 1];
  const content = lastMessage.content.toLowerCase();

  // Simulate processing delay
  setTimeout(() => {
    let response;

    // Simulate different responses based on keywords
    if (content.includes('code') || content.includes('programming')) {
      response = {
        text: `Here's a **simple example** of JavaScript code:\n\n\`\`\`\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet('World'));\n\`\`\`\n\nThis function uses template literals and is pretty *cool*!`
      };
    } else if (content.includes('laptop') || content.includes('product')) {
      response = {
        text: 'I found a great laptop for you! The **UltraBook Pro** is available for $899.\n\n- **Processor:** Intel i7\n- **RAM:** 16GB\n- **Storage:** 512GB SSD\n- **Screen:** 15.6" FHD\n\nVisit our website for more details!',
        toolCalls: [{
          toolName: 'searchForProducts',
          args: { productText: 'laptop' },
          result: '[{"id": 123, "name": "UltraBook Pro", "price": 899}]'
        }]
      };
    } else if (content.includes('error')) {
      return res.status(500).json({ error: 'Simulated error' });
    } else if (content.includes('hello') || content.includes('hi')) {
      response = {
        text: '**Hello!** 👋\n\nHow can I help you today?\n\nYou can ask me about:\n- Code examples\n- Product information\n- Or anything else!'
      };
    } else if (content.includes('format') || content.includes('markdown')) {
      response = {
        text: `Sure! Here's a demonstration of different **formatting options**:\n\n**Bold text** and *italic text*\n\nInline code: \`const x = 42;\`\n\nCode block:\n\`\`\`\nfunction example() {\n  console.log("Hello!");\n}\n\`\`\`\n\nBullet list:\n- First item\n- Second item\n- Third item\n\nPretty cool, right?`
      };
    } else {
      response = {
        text: `You said: **"${lastMessage.content}"**\n\nThis is a *mock response* from the test server!\n\n Try asking me about:\n- Code examples\n- Products\n- Formatting demo`
      };
    }

    res.json({
      response,
      timestamp: new Date().toISOString()
    });
  }, 1000); // 1 second delay to simulate real API
});

// Mock config endpoint
app.get('/api/config', (req, res) => {
  res.json({
    config: {
      model: 'mock-model',
      temperature: 0.7,
      maxTokens: 2048
    },
    mcp: {
      enabled: true,
      servers: []
    }
  });
});

app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Chat endpoint: POST http://localhost:${PORT}/api/chat`);
});
