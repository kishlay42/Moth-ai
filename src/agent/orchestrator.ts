import { AgentConfig, AgentState, AgentStep } from './types.js';
import { ToolRegistry } from '../tools/registry.js';
import { LLMMessage } from '../llm/types.js';
import { formatFileForContext, truncateFileContent } from '../utils/fileUtils.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class AgentOrchestrator {
  private config: AgentConfig;
  private state: AgentState;
  private tools: ToolRegistry;
  private root: string;

  constructor(config: AgentConfig, registry: ToolRegistry, root: string = process.cwd()) {
    this.config = config;
    this.tools = registry;
    this.root = root;
    this.state = {
      history: [],
      maxSteps: config.maxSteps || 10
    };
  }

  async *run(prompt: string, history: LLMMessage[] = []): AsyncGenerator<AgentStep, string, unknown> {
    let currentPrompt = prompt;

    for (let i = 0; i < this.state.maxSteps; i++) {
        // Collect all attached files from history
        const allAttachedFiles = this.collectAttachedFiles(history);
        
        // Construct system prompt with tools and file context
        const systemPrompt = await this.buildSystemPrompt(allAttachedFiles);
        
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
        
        // Show waiting status
        yield { thought: "Waiting for LLM response..." };
        
        const responseText: any = await this.callLLM(messages);
        
        // Parse response
        let step: AgentStep;
        try {
            step = this.parseResponse(responseText);
        } catch (e) {
            yield { thought: "LLM response received, processing...", toolOutput: `Parsing error: ${e}` };
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

  private async buildSystemPrompt(attachedFiles: string[] = []): Promise<string> {
    const toolDefs = this.tools.getDefinitions().map(t => 
        `${t.name}: ${t.description} Params: ${JSON.stringify(t.parameters)}`
    ).join('\n');

    // Automatically scan project context
    let projectContext = '';
    try {
      const contextResult = await this.tools.execute('scan_context', {});
      const files = contextResult.split('\n').filter((f: string) => f.trim());
      
      // Extract key information
      const fileCount = files.length - 1; // Subtract header line
      const extensions = new Set(files.map((f: string) => {
        const match = f.match(/\.(\w+)$/);
        return match ? match[1] : null;
      }).filter(Boolean));
      
      // Identify key files
      const keyFiles = files.filter((f: string) => 
        f.includes('package.json') || 
        f.includes('README') || 
        f.includes('tsconfig') ||
        f.includes('.config')
      ).slice(0, 10);
      
      projectContext = `
=== PROJECT CONTEXT ===

**Current Directory:** ${this.root}
**Total Files:** ${fileCount}
**Languages/Types:** ${Array.from(extensions).join(', ')}

**Key Files:**
${keyFiles.slice(1, 11).join('\n')}

**Note:** You have access to all project files. Use read_file, list_dir, or search_files to explore further.
`;
    } catch (e) {
      // If scanning fails, continue without context
      projectContext = `\n=== PROJECT CONTEXT ===\n**Current Directory:** ${this.root}\n`;
    }

    let fileContext = '';
    if (attachedFiles.length > 0) {
      fileContext = await this.buildFileContext(attachedFiles);
    }

    return `You are Moth, an intelligent CLI coding assistant with full access to the project filesystem and tools.

=== YOUR ROLE ===
You are the DRIVER of this mecha robot (the coding assistant). You have complete control over all tools and actions.
The user trusts you to make smart decisions about which tools to use and when.

=== AVAILABLE TOOLS ===
${toolDefs}

${projectContext}

${fileContext}

=== TOOL SELECTION GUIDELINES ===

**For File Operations:**

1. **create_file** - Use when:
   - Creating a brand new file that doesn't exist
   - User explicitly says "create a new file"
   - Starting a new component, module, or script
   - Will FAIL if file already exists (use write_file instead)

2. **write_file** - Use when:
   - Completely replacing/overwriting an existing file
   - User asks to "rewrite", "replace", or "change the entire file"
   - Making major changes where it's easier to rewrite than patch
   - The file is small (< 100 lines) and changes are extensive
   - PREFERRED for simple edits - it's more reliable than edit_file

3. **edit_file** - Use when:
   - Making targeted changes to large files (> 100 lines)
   - Only modifying specific sections while preserving the rest
   - User asks to "modify", "update", or "change a specific part"
   - You need to generate a Unified Diff (git diff format)
   - REQUIRES: Exact context matching - if unsure, use write_file instead

4. **read_file** - ALWAYS use before editing:
   - Read the file first to understand its current state
   - Verify the file exists before trying to edit it
   - Get the exact content for generating accurate diffs

**For Code Questions & Explanations:**

- If user asks "show me code" or "how do I..." → Use finalAnswer (don't create files)
- If user asks "create/write/save a file" → Use appropriate file tool
- If user asks "edit/modify @filename" → Read file first, then use write_file or edit_file

**For Project Understanding:**

- Use scan_context to understand project structure
- Use search_files to find specific files by name
- Use search_text to find code patterns or text
- Use read_file to examine specific files

**For Commands:**

- Use run_command for: npm install, git commands, running tests, etc.
- Always show the user what command you're running
- Explain the output in simple terms

=== DECISION MAKING PROCESS ===

When user asks to edit a file:
1. First, use read_file to see current content
2. Decide: Is this a small change or complete rewrite?
   - Small file or major changes? → write_file (easier, more reliable)
   - Large file with targeted changes? → edit_file (preserves rest of file)
3. Execute the chosen tool
4. Confirm what you did in finalAnswer

When user asks a question:
1. Is this asking for information or asking to DO something?
   - Information → Use finalAnswer with explanation
   - Action → Use appropriate tool
2. If unsure, ask the user to clarify

=== BEST PRACTICES ===

✅ DO:
- Read files before editing them
- Use write_file for most edits (it's simpler and more reliable)
- Explain what you're doing in your "thought"
- Give clear, helpful finalAnswers
- Use tools proactively when it makes sense

❌ DON'T:
- Create files for code examples unless explicitly asked
- Use edit_file without reading the file first
- Generate invalid diffs (if unsure, use write_file)
- Make assumptions - ask if unclear

=== RESPONSE FORMAT ===

Format your response exactly as a JSON object:

For using a tool:
{
  "thought": "I need to [action] because [reason]. I'll use [tool] to do this.",
  "toolCall": { "name": "tool_name", "arguments": { ... } }
}

For final answer:
{
  "thought": "I've completed the task. Here's what I did: [summary]",
  "finalAnswer": "Your detailed response with code/explanation/results"
}

=== FINAL ANSWER GUIDELINES ===

When you complete a task, NEVER just say "Done". Always provide a comprehensive response that includes:

1. **Summary of what was accomplished:**
   - "I've created/modified/deleted [X] file(s)"
   - List each file with its path

2. **File references:**
   - Use relative paths from project root
   - Example: "Created \`src/components/Button.tsx\`"
   - Example: "Modified \`package.json\` to add dependencies"

3. **What changed:**
   - Briefly explain what was added/modified/removed
   - Example: "Added a new Button component with TypeScript support"
   - Example: "Updated the API endpoint to use the new authentication flow"

4. **Next steps or suggestions:**
   - What the user might want to do next
   - Example: "You can now import this component with: \`import { Button } from './components/Button'\`"
   - Example: "Next, you might want to: run \`npm install\` to install the new dependencies"

5. **Testing/verification suggestions:**
   - How to verify the changes work
   - Example: "Run \`npm test\` to verify the tests pass"
   - Example: "Try running the app with \`npm start\`"

**Example of a GOOD final answer:**
"I've created a new Button component for you!

**Files created:**
- \`src/components/Button.tsx\` - Main Button component with TypeScript
- \`src/components/Button.css\` - Styling for the button

**What it includes:**
- Customizable size (small, medium, large)
- Multiple variants (primary, secondary, danger)
- TypeScript props for type safety
- Accessible with proper ARIA labels

**Next steps:**
1. Import it in your app: \`import { Button } from './components/Button'\`
2. Use it: \`<Button variant="primary" size="medium">Click me</Button>\`
3. Customize the colors in \`Button.css\` to match your theme

**To test:**
Run \`npm start\` and check the component renders correctly!"

**Example of a BAD final answer:**
"Done"
"File created"
"Task completed"

=== REMEMBER ===
You are the intelligent driver with full control. Make smart decisions about tools.
The user trusts you to choose the right approach. When in doubt, use the simpler tool (write_file over edit_file).
ALWAYS provide detailed, helpful final answers with file references and next steps!
`;
  }

  private collectAttachedFiles(history: LLMMessage[]): string[] {
    const files = new Set<string>();
    for (const msg of history) {
      if (msg.attachedFiles) {
        msg.attachedFiles.forEach(f => files.add(f));
      }
    }
    return Array.from(files);
  }

  private async buildFileContext(filePaths: string[]): Promise<string> {
    const fileContents: string[] = ['=== Referenced Files ===\n'];
    
    for (const filePath of filePaths) {
      try {
        const fullPath = path.join(this.root, filePath);
        // Security: Prevent breaking out of root
        if (!fullPath.startsWith(this.root)) {
          fileContents.push(`File: ${filePath}\nError: Access denied (outside project root)\n`);
          continue;
        }
        
        const content = await fs.readFile(fullPath, 'utf-8');
        const truncated = truncateFileContent(content, 500);
        const formatted = formatFileForContext(filePath, truncated);
        fileContents.push(formatted);
      } catch (e: any) {
        fileContents.push(`File: ${filePath}\nError: ${e.message}\n`);
      }
    }
    
    return fileContents.join('\n');
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
      try {
          // 1. Try to find JSON in code blocks
          const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
              const jsonContent = jsonMatch[1].trim();
              return JSON.parse(jsonContent);
          }
          
          // 2. Try to find the first outer-most JSON object
          // This regex matches from the first '{' to the last '}'
          const objectMatch = text.match(/\{[\s\S]*\}/);
          if (objectMatch) {
              return JSON.parse(objectMatch[0]);
          }
          
          // 3. Fallback: Try parsing the whole text (maybe it's raw JSON)
          return JSON.parse(text);
      } catch (e: any) {
          // If all parsing fails, but the text contains "Done" or "Completed", return it as a final answer
          if (text.toLowerCase().includes('done') || text.toLowerCase().includes('completed')) {
               return {
                   thought: "LLM responded with plain text indicating completion.",
                   finalAnswer: text
               };
          }
          throw new Error(`Could not parse JSON from response. Raw text: ${text.slice(0, 100)}...`);
      }
  }

  private async executeTool(name: string, args: any): Promise<string> {
      return await this.tools.execute(name, args);
  }
}
