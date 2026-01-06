# 🦋 Moth AI

[![npm version](https://img.shields.io/npm/v/moth-ai.svg)](https://www.npmjs.com/package/moth-ai)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

> **The World's First Truly Open CLI Assistant for Local & Open Source Models**

`[PLACEHOLDER: Initial Header Image - A sleek, high-contrast terminal screenshot showing the Moth AI welcome screen with the chromatic logo and system status. Ideally captures the moment of initialization.]`

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

`[PLACEHOLDER: LLM Switch Image - A split view showing the command palette being used to instantly toggle between a local Ollama model and GPT-4, demonstrating the speed and ease of switching contexts.]`

### 🤖 Agentic Capabilities with Role-Based Modes
Moth operates in three distinct modes to match your current task intensity:

1. **🔵 Default Mode:** A balanced assistant that asks for permission before executing sensitive actions.
2. **� Plan Mode:** Prioritizes detailed architectural planning. Moth creates comprehensive markdown plans for review before writing a single line of code.
3. **🚀 Autopilot Mode:** For trusted workflows. Moth executes authorized tool calls automatically, streamlining repetitive tasks.

`[PLACEHOLDER: Mode Toggling Image - A sequence showing the visual mode indicator in the bottom-left corner changing from 'DEFAULT' (Blue) to 'PLAN' (Magenta) to 'AUTOPILOT' (Yellow) via the Ctrl+B shortcut.]`

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
    `[PLACEHOLDER: New LLM Add Image - A screenshot sequence showing the interactive wizard for adding a new LLM profile, highlighting the clean UI for selecting providers and entering API keys.]`

3.  **Execute Commands:**
    - **Chat:** Simply type your query.
    - **Command Palette:** Press `Ctrl+U` to manage profiles and settings.
    - **Switch Modes:** Press `Ctrl+B` to cycle operational modes.

---

## �️ Configuration

Configuration is stored in `~/.moth/config.yaml`, allowing for portable and easy management of your AI profiles.

```yaml
profiles:
  - name: "production-gpt4"
    provider: "openai"
    model: "gpt-4"
    apiKey: "sk-..."
  - name: "local-dev"
    provider: "ollama"
    model: "llama3"
    baseUrl: "http://localhost:11434"
activeProfile: "local-dev"
mode: "default"
```

---

## 🤝 Contributing

We welcome contributions from the community. Please review our [contribution guidelines](CONTRIBUTING.md) before submitting pull requests.

---

*Moth AI — Coding at the speed of thought.*
