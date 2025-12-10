# Clippy Chat - Embeddable AI Chat Widget

An embeddable JavaScript widget that brings the classic Clippy character to life as an interactive AI assistant. Click Clippy to open a chat bubble powered by your AI agent backend.

## Features

- 🎯 **Classic Clippy Character** - Animated Microsoft Office assistant
- 💬 **Chat Bubble Interface** - Scrollable conversation history
- 🎭 **Context-Aware Animations** - Thinking, excited, confused, and more
- 🔌 **Easy Integration** - Single `<script>` tag embed
- 🛠️ **MCP Tool Support** - Automatic tool invocation via backend
- ⚙️ **Highly Configurable** - Position, colors, behavior, animations
- 🧪 **Fully Tested** - Unit, integration, and E2E tests

## Quick Start (For End Users)

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="clippy-chat.css">
</head>
<body>
  <h1>My Website</h1>

  <script src="clippy-chat.js"></script>
  <script>
    ClippyChat.init({
      apiUrl: 'http://localhost:8088',
      clippyPosition: 'bottom-right',
      autoGreeting: 'Hi! Need help finding products?'
    });
  </script>
</body>
</html>
```

## Project Status

**Current Status:** 🚧 Ready for development

**Completed:**
- ✅ Project planning (see PLAN.md)
- ✅ API documentation (see API.md)
- ✅ Testing strategy (see TESTING.md)
- ✅ Docker environment setup (see DOCKER-DEV.md)
- ✅ Agent testing infrastructure (see AGENT-TESTING.md)

**Next Steps:**
1. Initialize npm project
2. Implement core modules (Phase 1-9 from PLAN.md)
3. Create demo page
4. Write and run tests
5. Build production bundle

## Documentation

- **[PLAN.md](PLAN.md)** - Complete implementation plan with phases
- **[API.md](API.md)** - Backend API communication guide
- **[TESTING.md](TESTING.md)** - Testing strategy and examples
- **[AGENT-TESTING.md](AGENT-TESTING.md)** - LLM agent testing guide
- **[DOCKER-DEV.md](DOCKER-DEV.md)** - Docker development environment
- **[SETUP-CHECKLIST.md](SETUP-CHECKLIST.md)** - Quick setup guide for agents

## Development Environment

### Docker Setup (Recommended)

The project is configured to run inside the `ai-dev` Docker container with all necessary ports exposed:

```bash
# Enter the development container
docker exec -it wordpress-ai-dev-1 bash

# You'll be in /project/clippy-chat
# See SETUP-CHECKLIST.md for next steps
```

**Exposed Ports:**
- 3000 - Demo page / dev server
- 5173 - Vite dev server (alternative)
- 8088 - Agent API (via agent service)
- 8089 - Mock API server
- 9323 - Playwright inspector/UI

See [DOCKER-DEV.md](DOCKER-DEV.md) for complete Docker environment documentation.

### Local Setup (Alternative)

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Serve demo
npm run serve:demo
```

## Architecture

### Core Components

```
src/
├── index.js              # Main entry & API
├── clippy-chat-widget.js # Widget orchestrator
├── chat-bubble.js        # Speech bubble component
├── chat-interface.js     # Chat UI
├── animation-controller.js # Animation state machine
├── api-client.js         # Backend communication
├── session-manager.js    # Conversation management
└── styles/
    ├── clippy.css        # Clippy positioning
    ├── bubble.css        # Bubble styling
    └── chat.css          # Chat interface styles
```

### User Flow

1. **Idle** - Clippy visible, playing idle animations
2. **Click Clippy** - Greeting animation, bubble appears
3. **User types** - Listening animation
4. **User sends** - Thinking animation, API call
5. **Response** - Excited animation, message displays
6. **Close bubble** - Conversation cleared, back to idle
7. **Reopen** - Fresh session starts

## Testing

### Test Layers

- **Unit Tests** (Jest + JSDOM) - Individual modules
- **Integration Tests** (Jest) - Component interactions
- **E2E Tests** (Playwright) - Complete user flows
- **Mock Server** - Backend simulation for development
- **Visual Tests** - Screenshot verification

### Run Tests

```bash
# All unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Start mock server
npm run serve:mock
```

See [TESTING.md](TESTING.md) for comprehensive testing documentation.

## Configuration API

```javascript
ClippyChat.init({
  // API Configuration
  apiUrl: 'http://localhost:8088',
  model: 'ai/granite-4.0-h-tiny:7B-Q4_K_M',
  enableTools: true,

  // Clippy Configuration
  clippyPosition: 'bottom-right',
  clippyOffsetX: 20,
  clippyOffsetY: 20,

  // Bubble Configuration
  bubbleWidth: 350,
  bubbleHeight: 500,

  // Behavior
  autoGreeting: 'Hi! How can I help?',
  playIdleAnimations: true,

  // Animations
  animations: {
    greeting: 'Wave',
    thinking: 'Processing',
    excited: 'Congratulate',
  },

  // Styling
  theme: {
    userMessageBg: '#007bff',
    assistantMessageBg: '#f0f0f0',
  }
});
```

See [API.md](API.md) for complete API documentation.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

### Runtime
- jQuery (bundled, required by ClippyJS)

### Development
- Rollup - Module bundler
- Jest - Unit testing
- Playwright - E2E testing
- ClippyJS - Character animation

## Contributing

This project is developed with assistance from LLM agents. The testing infrastructure is designed to allow agents to verify their code.

### For LLM Agents

See [AGENT-TESTING.md](AGENT-TESTING.md) for instructions on how to test code during development.

Quick commands:
```bash
# Test a module
node src/module-name.js

# Run unit tests
npm test

# Visual verification
npx playwright test --screenshot=on
```

## License

MIT License (same as ClippyJS)

## Credits

- ClippyJS library by Smore (ES6 rewrite by pi0)
- Original Clippy character by Microsoft
- AI chat backend integration

## Contact & Support

For issues or questions, see the main project repository.

---

**Ready to start development!** Enter the Docker container and follow [SETUP-CHECKLIST.md](SETUP-CHECKLIST.md).
