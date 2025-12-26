import { ToolRegistry } from './registry.js';
import * as Defs from './definitions.js'; // Import all as Defs
import { PermissionResponse } from './types.js';
import { TodoManager } from '../planning/todoManager.js';
import { Patcher } from '../editing/patcher.js';
import { ProjectScanner } from '../context/scanner.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

type PermissionCheck = (toolName: string, args: any) => Promise<PermissionResponse>;

export function createToolRegistry(root: string, todoManager: TodoManager, checkPermission?: PermissionCheck): ToolRegistry {
  const registry = new ToolRegistry();
  const patcher = new Patcher(root);
  const scanner = new ProjectScanner(root);

  // --- Middleware ---
  const withPermission = (name: string, executor: (args: any) => Promise<string>) => {
      return async (args: any) => {
          if (checkPermission) {
              const response = await checkPermission(name, args);
              if (!response.allowed) {
                   return response.feedback 
                    ? `User denied permission with feedback: ${response.feedback}` 
                    : "User denied permission.";
              }
          }
          return executor(args);
      };
  };

  // --- Implementations ---

  // 5. Planning
  registry.register(Defs.TodoWriteTool, async (args) => {
      if (args.action === 'add') todoManager.add(args.text);
      if (args.action === 'update') todoManager.updateStatus(args.id, args.status);
      return "Todo updated.";
  });

  registry.register(Defs.TodoReadTool, async () => {
      return JSON.stringify(todoManager.list(), null, 2);
  });

  // 1. Filesystem
  registry.register(Defs.ReadFileTool, async (args) => {
      const fullPath = path.join(root, args.path);
      // Security: Prevent breaking out of root
      if (!fullPath.startsWith(root)) return "Error: Access denied (outside root).";
      try {
        return await fs.readFile(fullPath, 'utf-8');
      } catch (e: any) { return `Error reading file: ${e.message}`; }
  });

  registry.register(Defs.ListDirTool, async (args) => {
      const fullPath = path.join(root, args.path);
      if (!fullPath.startsWith(root)) return "Error: Access denied.";
      try {
        const files = await fs.readdir(fullPath);
        return files.join('\n');
      } catch (e: any) { return `Error listing dir: ${e.message}`; }
  });

  // GATED: Create File
  registry.register(Defs.CreateFileTool, withPermission('create_file', async (args) => {
      const fullPath = path.join(root, args.path);
      if (!fullPath.startsWith(root)) return "Error: Access denied.";
      try {
          await fs.access(fullPath);
          return "Error: File already exists. Use write_file to overwrite.";
      } catch {
          // File doesn't exist, proceed
          await fs.writeFile(fullPath, args.content || '');
          return `File created at ${args.path}`;
      }
  }));

  // GATED: Write File
  registry.register(Defs.WriteFileTool, withPermission('write_file', async (args) => {
      const fullPath = path.join(root, args.path);
      if (!fullPath.startsWith(root)) return "Error: Access denied.";
      await fs.writeFile(fullPath, args.content);
      return `File written to ${args.path}`;
  }));

  // GATED: Edit File
  registry.register(Defs.EditFileTool, withPermission('edit_file', async (args) => {
      // Patcher handles safety/backups internally
      const success = await patcher.applyPatch(args.path, args.diff);
      return success ? "Patch applied successfully." : "Patch application failed (check context/backups).";
  }));

  // GATED: Create Dir
  registry.register(Defs.CreateDirTool, withPermission('create_dir', async (args) => {
      const fullPath = path.join(root, args.path);
      if (!fullPath.startsWith(root)) return "Error: Access denied.";
      await fs.mkdir(fullPath, { recursive: true });
      return `Directory created: ${args.path}`;
  }));

  // 2. Search & Discovery
  registry.register(Defs.SearchTextTool, async (args) => {
      // Using grep for speed (assuming unix/git bash context or simple grep availability)
      // Fallback: This is a hacky implementation, properly we should traverse.
      // For now, let's use Scanner to get files and basic JS search if grep fails? 
      // Actually, let's trust child_process 'grep' or 'findstr' based on OS, OR implement JS search.
      // JS Search is safer and cross-platform.
      try {
          const files = await scanner.scan(); // Get all files
          const regex = new RegExp(args.query);
          const results = [];
          for (const file of files.slice(0, 50)) { // Limit to 50 for perf
             const content = await fs.readFile(path.join(root, file), 'utf-8');
             if (regex.test(content)) results.push(file);
          }
          return `Found in:\n${results.join('\n')}`;
      } catch (e: any) { return `Search error: ${e.message}`; }
  });

  registry.register(Defs.SearchFilesTool, async (args) => {
      const files = await scanner.scan();
      // Simple includes check
      return files.filter(f => f.includes(args.pattern)).join('\n');
  });

  // 3. Command Execution - GATED
  registry.register(Defs.RunCommandTool, withPermission('run_command', async (args) => {
      try {
          const { stdout, stderr } = await execAsync(args.command, { cwd: args.cwd || root });
          return `STDOUT:\n${stdout}\nSTDERR:\n${stderr}`;
      } catch (e: any) {
          return `Command failed: ${e.message}\nSTDOUT:\n${e.stdout}\nSTDERR:\n${e.stderr}`;
      }
  }));

  // 4. Context
  registry.register(Defs.ScanContextTool, async () => {
      const files = await scanner.scan();
      return `Project Files (${files.length}):\n${files.join('\n')}`;
  });

  registry.register(Defs.SummarizeFileTool, async (args) => {
      const fullPath = path.join(root, args.path);
      try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const lines = content.split('\n').slice(0, 100);
          return `Summary (first 100 lines):\n${lines.join('\n')}`;
      } catch (e: any) { return `Error: ${e.message}`; }
  });

  // 5. Extras
  registry.register(Defs.GitDiffTool, async () => {
      try {
          const { stdout } = await execAsync('git diff', { cwd: root });
          return stdout || "No changes.";
      } catch (e: any) { return `Git error: ${e.message}`; }
  });

  registry.register(Defs.GitCommitTool, withPermission('git_commit', async (args) => {
      try {
          // Add all? Or just commit? Let's assume user staged manually or we add all.
          // Safety: Let's just commit what is staged.
          const { stdout } = await execAsync(`git commit -m "${args.message}"`, { cwd: root });
          return stdout;
      } catch (e: any) { return `Commit error: ${e.message}`; }
  }));

  registry.register(Defs.TestRunTool, withPermission('test_run', async (args) => {
      const cmd = args.command || 'npm test';
      try {
           const { stdout, stderr } = await execAsync(cmd, { cwd: root });
           return `Test Results:\n${stdout}\n${stderr}`;
      } catch (e: any) { return `Tests failed: ${e.message}`; }
  }));

  registry.register(Defs.FormatFileTool, withPermission('format_file', async (args) => {
       try {
           await execAsync(`npx prettier --write "${args.path}"`, { cwd: root });
           return `Formatted ${args.path}`;
       } catch (e: any) { return `Format error: ${e.message}`; }
  }));

  return registry;
}
