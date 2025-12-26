# Core Logic Modules

## Agent Orchestrator (`src/agent/orchestrator.ts`)

The `AgentOrchestrator` is the brain of Moth. It implements a ReAct-style loop to solve user tasks.

### Key Responsibilities
-   **Conversation History**: It maintains `messages` state (User/Assistant), providing short-term memory.
-   **Tool Execution**: It parses LLM responses and executes tools via `ToolRegistry`.
-   **Loop Management**: It manages the `maxSteps` loop to prevent infinite recursion.

### Code Snippet: Memory Injection
```typescript
// src/agent/orchestrator.ts
async *run(prompt: string, history: LLMMessage[] = []): AsyncGenerator<AgentStep, string, unknown> {
    // ...
    const messages: LLMMessage[] = [
        { role: 'user', content: systemPrompt },
        ...history, // <--- Injection of past context
        { role: 'user', content: currentPrompt }
    ];
    // ...
}
```

## Context Management (`src/context`)

Moth uses a proactive context system to understand the user's project.

### Project Scanner (`src/context/scanner.ts`)
-   **Function**: Scans the current directory to identify project types (Node.js, Python, C++, etc.).
-   **Heuristics**: Checks for marker files (`package.json`, `requirements.txt`, `CMakeLists.txt`).

## Configuration Manager (`src/config/configManager.ts`)

The config manager handles persistent state, including LLM profiles.

### Data Structure
```typescript
interface ActiveConfig {
    activeProfile: string;
    profiles: Record<string, LLMProfile>;
}

interface LLMProfile {
    name: string;
    provider: 'ollama' | 'openai-compatible' | 'gemini-native' | ...;
    model: string;
    apiBase?: string;
    apiKeyLoc?: string; // Pointer to keychain, not the key itself
}
```
-   **Security**: API keys are NEVER stored in `config.json`. They are managed via the system keychain (or mock implementation).
