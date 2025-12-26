import { ToolDefinition } from './definitions.js';

type ToolExecutor = (args: any) => Promise<string>;

export class ToolRegistry {
  private tools: Map<string, { definition: ToolDefinition; executor: ToolExecutor }> = new Map();

  register(definition: ToolDefinition, executor: ToolExecutor) {
    this.tools.set(definition.name, { definition, executor });
  }

  getDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  async execute(name: string, args: any): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found.`);
    }
    try {
      return await tool.executor(args);
    } catch (error: any) {
      return `Error executing tool '${name}': ${error.message}`;
    }
  }
}
