# 🦋 Moth AI

[![npm version](https://img.shields.io/npm/v/moth-ai.svg)](https://www.npmjs.com/package/moth-ai)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

> **The World's First Truly Open CLI Assistant for Local & Open Source Models**

<img width="953" height="392" alt="Screenshot 2026-01-07 013431" src="https://github.com/user-attachments/assets/55e104e2-8441-4a74-b3f7-c74340d806fa" />

---

## Overview

Moth AI is the **first terminal-native coding assistant** built from the ground up to treat **local and open-source LLMs** as first-class citizens. While others lock you into proprietary models or cloud subscripts, Moth is truly open source—in code, philosophy, and model support.

It empowers you to **write, debug, refactor, and reason about code** using **your own models** on **your own hardware**. Whether you're running Llama 3 on a MacBook or GPT-4 in the cloud, Moth gives you the same powerful agentic capabilities without the compromise.

---

## 🚀 Key Features

### 🔓 Truly Open & Local-First
Moth is the only CLI tool designed to democratize AI access.
- **Local Native:** Optimized deeply for Ollama. Run **Llama 3, Mistral, Gemma, or DeepSeek** locally with zero latency, 100% privacy, and no internet connection required.
- **Open Source First:** We support any OpenAI-compatible endpoint, making it universally compatible with the open ecosystem of model servers (LM Studio, LocalAI, etc.).
- **Cloud Optional:** Seamlessly integrate OpenAI (GPT-4), Anthropic (Claude), or Google (Gemini) when you need extra horsepower—but only when *you* choose to.


### 🤖 Agentic Capabilities with Role-Based Modes
Moth operates in three distinct modes to match your current task intensity:

1. **🔵 Default Mode:** A balanced assistant that asks for permission before executing sensitive actions.
2. **� Plan Mode:** Prioritizes detailed architectural planning. Moth creates comprehensive markdown plans for review before writing a single line of code.
3. **🚀 Autopilot Mode:** For trusted workflows. Moth executes authorized tool calls automatically, streamlining repetitive tasks.

<img width="948" height="112" alt="Screenshot 2026-01-07 003822" src="https://github.com/user-attachments/assets/ff14a463-157d-4107-8de1-519257355989" />

<img width="940" height="108" alt="Screenshot 2026-01-07 003744" src="https://github.com/user-attachments/assets/345509dd-a89a-4b78-83df-9c21c51f4e82" />

### 🛡️ Secure & Transparent
- **Permission-First Architecture:** You approve every significant file edit or shell command.
- **Context-Aware:** Moth intelligently scans your project structure to provide relevant answers, not hallucinations.

---

## 📦 Installation

### Global Installation (Recommended)
Install Moth AI globally to access the `moth` command from any directory.

```bash
npm install -g moth-ai
```

### Local Installation
For project-specific constraints.

```bash
npm install moth-ai
npx moth-ai
```

**Requirements:** Node.js >= 18.0.0

---

## ⚡ Quick Start

1.  **Initialize Moth:**
    ```bash
    moth
    ```

2.  **Configure Your First Profile:**
    Run the interactive setup wizard to connect your preferred model.
    ```bash
    moth llm add
    ```
<img width="611" height="379" alt="image" src="https://github.com/user-attachments/assets/a90c54ee-54f7-4391-a29f-f2bdf40d5709" />

3.  **Execute Commands:**
    - **Chat:** Simply type your query.
    - **Command Palette:** Press `Ctrl+U` to manage profiles and settings.
    - **Switch Modes:** Press `Ctrl+B` to cycle operational modes.

---
```

*Moth AI — Coding at the speed of thought.*

