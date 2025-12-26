import { AgentConfig, AgentState, AgentStep } from './types.js';
import { ToolRegistry } from '../tools/registry.js';
import { LLMMessage } from '../llm/types.js';

export class AgentOrchestrator {
  private config: AgentConfig;
  private state: AgentState;
  private tools: ToolRegistry;

  constructor(config: AgentConfig, registry: ToolRegistry) {
    this.config = config;
    this.tools = registry;
    this.state = {
      history: [],
      maxSteps: config.maxSteps || 10
    };
  }

  async *run(prompt: string, history: LLMMessage[] = []): AsyncGenerator<AgentStep, string, unknown> {
    let currentPrompt = prompt;

    for (let i = 0; i < this.state.maxSteps; i++) {
        // Construct system prompt with tools
        const systemPrompt = this.buildSystemPrompt();
        
        // Full context: System -> History -> Current State
        const messages: LLMMessage[] = [
            { role: 'user', content: systemPrompt }, // In many APIs system prompt is special, here we use user role as generic fallback or modify Client to handle system
            ...history,
            { role: 'user', content: currentPrompt }
        ];

        // This is a simplified Mock for the ReAct loop to start with
        // In reality, we need to handle the LLM raw output, parse "Thought" and "Tool Call"
        // For now, we will rely on a Structured Output or strict parsing if the Provider supports it.
        
        // Since we are using Gemini, we can ask for JSON mode or specific formatting.
        
        const responseText: any = await this.callLLM(messages);
        
        // Parse response
        let step: AgentStep;
        try {
            step = this.parseResponse(responseText);
        } catch (e) {
            yield { thought: "Failed to parse LLM response. Retrying...", toolOutput: `Error: ${e}` };
            continue;
        }

        this.state.history.push(step);
        yield step;

        if (step.finalAnswer) {
            return step.finalAnswer;
        }

        if (step.toolCall) {
            // Execute tool
            const result = await this.executeTool(step.toolCall.name, step.toolCall.arguments);
            step.toolOutput = result;
            
            // Re-feed result to LLM
            currentPrompt = `Tool '${step.toolCall.name}' returned: ${result}`;
        }
    }

    return "Max steps reached.";
  }

  private buildSystemPrompt(): string {
    const toolDefs = this.tools.getDefinitions().map(t => 
        `${t.name}: ${t.description} Params: ${JSON.stringify(t.parameters)}`
    ).join('\n');

    return `You are Moth, an intelligent CLI coding assistant.
You have access to the following tools:
${toolDefs}

IMPORTANT GUIDELINES:
1. For general questions, explanations, or code snippets that don't need to be saved, use "finalAnswer". 
2. Do NOT use "write_to_file" unless the user explicitly asks to save a file or implies a persistent change.
3. If the user asks for "Hello World code", just show it in the explanation (finalAnswer). Do NOT create a file for it.
4. Be concise and helpful.

Format your response exactly as a JSON object:
{
  "thought": "your reasoning",
  "toolCall": { "name": "tool_name", "arguments": { ... } }
}
OR if you are done/replying:
{
  "thought": "reasoning",
  "finalAnswer": "your response/code/explanation"
}
`;
  }

  private async callLLM(messages: any[]): Promise<string> {
      // Direct integration with LLM Client
      // This assumes Client has a simple chat interface returning string
      // We might need to adjust LLMClient interface to support non-streaming one-off calls
      
      // Placeholder: We will need to implement a 'generate' method on LLMClient
      // or collect the stream.
      
      let fullText = "";
      for await (const chunk of this.config.model.chatStream(messages)) {
          fullText += chunk;
      }
      return fullText;
  }

  private parseResponse(text: string): AgentStep {
      // Clean markdown code blocks if present
      const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonText);
  }

  private async executeTool(name: string, args: any): Promise<string> {
      return await this.tools.execute(name, args);
  }
}
