# Vico Memory Taker - Chrome Extension

<div align="center">

[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)

</div>

## Overview

Vico Memory Taker is the Chrome extension component of the Vico Vision Memory Copilot system. It enables seamless capture and storage of web content, images, and text directly from the browser into the Vico memory management system.

## Features

- **One-Click Memory Capture**: Instantly save any webpage content to your Vico memory system
- **Smart Content Selection**: Intelligently select and capture specific parts of webpages
- **Visual Processing Integration**: Direct integration with Vico's MLX-powered vision models
- **Context Preservation**: Automatically captures relevant metadata and context
- **Real-time Sync**: Immediate synchronization with the Vico backend

## Installation

1. Install dependencies:
```bash
bun install
```

2. Start the development environment:
```bash
bun run dev
```

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `build` directory from this project

## Configuration

By default, the extension will use the Vico backend running on `http://localhost:3020`.

## Usage

The Vico Memory Taker extension provides several ways to capture and save web content:

### Text Memories
1. Select any text on a webpage
2. Right-click and choose "Text" from the Vico Memory Taker menu
3. Edit the text in the modal if needed
4. Click "Save Memory" to store it in your Vico system

### Full Screenshot Memories
1. Navigate to the webpage you want to capture
2. Right-click anywhere and select "Screenshot" from the Vico Memory Taker menu
3. Review the captured screenshot in the modal
4. Click "Save Memory" to store it

### Cropped Screenshot Memories
1. Right-click anywhere and select "Cropped Screenshot"
2. Click and drag to select the area you want to capture
3. Release to capture the selected area
4. Review the cropped image in the modal
5. Click "Save Memory" to store it

## Related Projects

- [Vico](https://github.com/d-r-w/vico) - Main Vico system backend

## Acknowledgments

Built using [bun-chrome-extension](https://github.com/luqmanoop/bun-chrome-extension) ❤️.