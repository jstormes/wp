# Clippy Test Demo

## Files

- **clippy-test.html** - Comprehensive test page for Clippy movement and animations

## How to Use

### Option 1: Open directly in browser
```bash
# Navigate to the file and double-click
D:\wordpress\clippy-chat\demo\clippy-test.html
```

### Option 2: Use a local server (RECOMMENDED)
```bash
cd clippy-chat
npx http-server . -p 3000 -o /demo/
# Opens at http://localhost:3000/demo/
```

**Important**: The server must run from the project root (not the demo directory) so that the `/vendor/` and `/dist/` paths resolve correctly.

**Alternative using npm script** (may have path issues):
```bash
cd clippy-chat
npm run serve:demo
# Opens at http://localhost:3000
# Note: This serves from demo/ directory and may break resource paths
```

### Option 3: Simple Python server
```bash
cd demo
python -m http.server 3000
# Open http://localhost:3000/clippy-test.html
```

## Features

### Position Controls
- 9 preset positions (corners, edges, center)
- Custom X/Y coordinate input
- Adjustable animation duration (0-5000ms)

### Animation Tests
- 12 common animations with buttons
- Random animation button
- List all available animations
- Stop/Pause/Resume controls

### Speech Bubble
- Custom text input
- 4 preset messages
- Tests Clippy's speech feature

### Combo Actions
- Greeting + Move to center
- Search + Think sequence
- Corner tour (visits all corners)
- Celebrate + Wave combo

### Status Display
- Real-time position tracking
- Window size display
- Queue length monitoring
- Animation list viewer

## Controls

**Position Buttons**: Click any position button to move Clippy
**Custom Position**: Enter X, Y coordinates and duration, then click "Move to Custom"
**Animations**: Click any animation button to play that animation
**Speech**: Type text and click "Speak" or use preset messages
**Combos**: Test multi-step action sequences

## Debugging

Press **Ctrl+D** to log debug info to console

## Notes

- Clippy loads at bottom-right corner initially
- All movements use `agent.stop()` to clear the queue first
- Default duration is 500ms (adjustable)
- Position is tracked in real-time
- Queue length shows pending actions

## Based On

This test page implements best practices from `CLIPPY_NOTES.md`:
- ✅ Includes clippy.css (required)
- ✅ Loads jQuery before ClippyJS
- ✅ Calls moveTo() before show() on init
- ✅ Uses agent.stop() before repositioning
- ✅ Calculates positions from window dimensions
