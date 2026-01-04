# 🦋 Moth AI

[![npm version](https://img.shields.io/npm/v/@kishlay42/moth-ai.svg)](https://www.npmjs.com/package/@kishlay42/moth-ai)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/node/v/@kishlay42/moth-ai.svg)](https://nodejs.org)

**The Intelligent, Local-First CLI Coding Assistant**

Moth AI is a powerful **terminal-native coding assistant** built for developers who value **privacy, speed, and control**. It lives inside your terminal, understands your project context, and helps you **write, debug, refactor, and reason about code** using both **local and cloud LLMs**.

<img width="1095" height="504" alt="Moth AI Screenshot" src="https://github.com/user-attachments/assets/23b83a6b-2b63-45af-b9ec-a6dcb0a89b2f" />

---

## 📦 Installation

### Global Installation (Recommended)

Install Moth AI globally to use it anywhere on your system:

```bash
npm install -g @kishlay42/moth-ai
```

After installation, simply run:

```bash
moth
```

### Local Installation

Install in a specific project:

```bash
npm install @kishlay42/moth-ai
```

Run using npx:

```bash
npx moth
```

### Requirements

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0

---

## 🚀 Quick Start

1. **Install Moth AI globally:**
   ```bash
   npm install -g @kishlay42/moth-ai
   ```

2. **Add your first LLM profile:**
   ```bash
   moth llm add
   ```
   
   Choose from:
   - **Local models** (via Ollama) - Free, private, offline
   - **Cloud providers** (OpenAI, Anthropic, Google) - Requires API key

3. **Start chatting:**
   ```bash
   moth
   ```

4. **Use the command palette:**
   - Press `Ctrl+U` to access all commands
   - Switch profiles, toggle autopilot, and more

---

## ✨ Key Features

### 🧠 LLM-Agnostic & Local-First

Use **any LLM**, local or cloud — switch instantly without changing workflows.

- **Local (via Ollama)**  
  Run models like **Llama 3**, **Mistral**, **Gemma**, and **DeepSeek-Coder** locally  
  → Zero latency, full privacy, offline-friendly

- **Cloud Providers**  
  Plug in your own API keys for:
  - OpenAI (GPT-4 / GPT-4o)
  - Anthropic (Claude 3.5 Sonnet)
  - Google (Gemini)

<img width="1093" height="241" alt="LLM Switching" src="https://github.com/user-attachments/assets/2de67c9d-f562-4ce3-8bc6-51e2066b69ae" />

---

### 🤖 Agentic Capabilities

Moth is not just a chatbot — it's an **AI agent**.

- **Task Planning** – Break complex goals into executable steps  
- **File Editing** – Precise diffs, patches, and refactors  
- **Terminal Control** – Run builds, tests, and Git commands from chat  
- **Context-Aware** – Understands your project structure and codebase

---

### 🛡️ Permission-First by Design

You stay in control — always.

- Explicit approval before file edits or command execution  
- Granular permissions per action  
- **Autopilot mode** for trusted workflows  
- Feedback loop to guide the agent instead of blind execution  

---

### 🎭 Moth Profiles

Save and switch between different AI personalities.

- **Coding Profile** – Optimized for TypeScript / Python  
- **Architecture Profile** – Reasoning-focused for system design  
- **Fast Profile** – Lightweight local model for quick answers  

---

## � CLI Commands

### Main Commands

```bash
# Start interactive chat
moth

# Show help
moth --help

# Display version
moth --version
```

### LLM Profile Management

```bash
# Add a new LLM profile
moth llm add

# List all configured profiles
moth llm list

# Switch to a different profile
moth llm use

# Remove a profile
moth llm remove
```

### Keyboard Shortcuts

- **Ctrl+U** - Open command palette
- **Ctrl+C** - Exit chat
- **Arrow Keys** - Navigate command palette
- **Enter** - Execute selected command

---

## ⚙️ Configuration

Moth AI stores configuration in `~/.moth/config.yaml`

### Example Configuration

```yaml
profiles:
  - name: "gpt-4"
    provider: "openai"
    model: "gpt-4"
    apiKey: "sk-..."
    
  - name: "local-llama"
    provider: "ollama"
    model: "llama3"
    baseUrl: "http://localhost:11434"
    
activeProfile: "gpt-4"
```

### Setting Up Ollama (Local Models)

1. Install Ollama: https://ollama.ai
2. Pull a model:
   ```bash
   ollama pull llama3
   ```
3. Add to Moth:
   ```bash
   moth llm add
   # Select "Ollama" and choose your model
   ```

### Setting Up Cloud Providers

#### OpenAI
```bash
moth llm add
# Select "OpenAI"
# Enter your API key from https://platform.openai.com/api-keys
```

#### Anthropic (Claude)
```bash
moth llm add
# Select "Anthropic"
# Enter your API key from https://console.anthropic.com/
```

#### Google (Gemini)
```bash
moth llm add
# Select "Google"
# Enter your API key from https://makersuite.google.com/app/apikey
```

---

## 💡 Usage Examples

### Basic Chat

```bash
moth
> How do I implement a binary search in TypeScript?
```

### Code Refactoring

```bash
moth
> Refactor src/utils.ts to use async/await instead of promises
```

### Debugging

```bash
moth
> Why is my React component re-rendering infinitely?
```

### Project Analysis

```bash
moth
> Analyze the architecture of this project and suggest improvements
```

---

## 🔧 Troubleshooting

### Command not found: moth

Make sure the global npm bin directory is in your PATH:

```bash
npm config get prefix
```

Add the bin directory to your PATH in `~/.bashrc` or `~/.zshrc`:

```bash
export PATH="$PATH:$(npm config get prefix)/bin"
```

### Ollama connection error

Ensure Ollama is running:

```bash
ollama serve
```

### API key errors

Verify your API key is correctly configured:

```bash
moth llm list
# Check if your profile shows the correct provider
```

---

## 📝 License

ISC License - see [LICENSE](LICENSE) file for details

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Repository: https://github.com/kishlay42/Moth-ai

---

## 📚 Links

- **npm Package**: https://www.npmjs.com/package/@kishlay42/moth-ai
- **GitHub**: https://github.com/kishlay42/Moth-ai
- **Issues**: https://github.com/kishlay42/Moth-ai/issues

---

**Made with ❤️ for developers who code in the terminal**
