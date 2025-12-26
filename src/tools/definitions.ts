export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

// --- 5. Planning (Keep Existing) ---
export const TodoWriteTool: ToolDefinition = {
  name: 'todo_write',
  description: 'Add a new task to the plan or update an existing task status.',
  parameters: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['add', 'update'], description: 'Action to perform.' },
      text: { type: 'string', description: 'Text content of the task (required for add).' },
      id: { type: 'string', description: 'ID of the task to update (required for update).' },
      status: { type: 'string', enum: ['pending', 'in-progress', 'completed', 'failed'], description: 'New status.' }
    },
    required: ['action']
  }
};

export const TodoReadTool: ToolDefinition = {
  name: 'todo_read',
  description: 'Read the current plan and task statuses.',
  parameters: { type: 'object', properties: {} }
};

// --- 1. Filesystem Tools ---
export const ReadFileTool: ToolDefinition = {
  name: 'read_file',
  description: 'Read the contents of a file.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to the file.' }
    },
    required: ['path']
  }
};

export const ListDirTool: ToolDefinition = {
  name: 'list_dir',
  description: 'List contents of a directory.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Directory path.' }
    },
    required: ['path']
  }
};

export const CreateFileTool: ToolDefinition = {
  name: 'create_file',
  description: 'Create a new file (fails if exists).',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path for the new file.' },
      content: { type: 'string', description: 'Initial content (optional).' }
    },
    required: ['path']
  }
};

export const WriteFileTool: ToolDefinition = {
  name: 'write_file',
  description: 'Overwrite an entire file.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to the file.' },
      content: { type: 'string', description: 'New content.' }
    },
    required: ['path', 'content']
  }
};

export const EditFileTool: ToolDefinition = {
  name: 'edit_file',
  description: 'Modify a file using a Unified Diff.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to the file.' },
      diff: { type: 'string', description: 'Unified Diff string to apply.' }
    },
    required: ['path', 'diff']
  }
};

export const CreateDirTool: ToolDefinition = {
  name: 'create_dir',
  description: 'Create a new directory.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Directory path.' }
    },
    required: ['path']
  }
};

// --- 2. Search & Discovery ---
export const SearchTextTool: ToolDefinition = {
  name: 'search_text',
  description: 'Search for text across project files.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Text or regex to search for.' },
      path: { type: 'string', description: 'Specific path to limit search (optional).' }
    },
    required: ['query']
  }
};

export const SearchFilesTool: ToolDefinition = {
  name: 'search_files',
  description: 'Find files by name or pattern.',
  parameters: {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'Glob pattern or filename.' }
    },
    required: ['pattern']
  }
};

// --- 3. Command Execution ---
export const RunCommandTool: ToolDefinition = {
  name: 'run_command',
  description: 'Execute a shell command.',
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'Command to execute.' },
      cwd: { type: 'string', description: 'Working directory (optional).' }
    },
    required: ['command']
  }
};

// --- 4. Context Tools ---
export const ScanContextTool: ToolDefinition = {
  name: 'scan_context',
  description: 'Scan project structure and understand file hierarchy.',
  parameters: {
    type: 'object',
    properties: {
      root: { type: 'string', description: 'Root directory to scan (optional).' }
    }
  }
};

export const SummarizeFileTool: ToolDefinition = {
  name: 'summarize_file',
  description: 'Get a summary of a file (first 100 lines).',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path.' }
    },
    required: ['path']
  }
};

// --- Extras (Git/Test/Format) ---
export const GitDiffTool: ToolDefinition = {
  name: 'git_diff',
  description: 'Show unstaged changes (git diff).',
  parameters: { type: 'object', properties: {} }
};

export const GitCommitTool: ToolDefinition = {
  name: 'git_commit',
  description: 'Commit staged changes.',
  parameters: {
    type: 'object',
    properties: {
      message: { type: 'string', description: 'Commit message.' }
    },
    required: ['message']
  }
};

export const TestRunTool: ToolDefinition = {
  name: 'test_run',
  description: 'Run project tests.',
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'Specific test command (optional).' }
    }
  }
};

export const FormatFileTool: ToolDefinition = {
  name: 'format_file',
  description: 'Format a file (using prettier if available).',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path.' }
    },
    required: ['path']
  }
};
