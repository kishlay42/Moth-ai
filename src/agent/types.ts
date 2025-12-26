import { ToolDefinition } from '../tools/definitions.js';

export interface AgentStep {
  thought: string;
  toolCall?: {
    name: string;
    arguments: Record<string, any>;
  };
  toolOutput?: string;
  finalAnswer?: string;
}

export interface AgentState {
  history: AgentStep[];
  maxSteps: number;
}

export interface AgentConfig {
  tools: ToolDefinition[];
  model: any; // LLM Client
  maxSteps?: number;
}
