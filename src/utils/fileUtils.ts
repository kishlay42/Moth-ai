import * as path from 'path';

/**
 * Filter files by query using simple substring matching
 */
export function fuzzyMatchFiles(query: string, files: string[]): string[] {
  const lowerQuery = query.toLowerCase();
  return files.filter(file => file.toLowerCase().includes(lowerQuery));
}

/**
 * Truncate file content to a maximum number of lines
 */
export function truncateFileContent(content: string, maxLines: number = 500): string {
  const lines = content.split('\n');
  if (lines.length <= maxLines) {
    return content;
  }
  
  const truncated = lines.slice(0, maxLines).join('\n');
  return `${truncated}\n\n... (truncated ${lines.length - maxLines} lines)`;
}

/**
 * Format file for LLM context with proper delimiters
 */
export function formatFileForContext(filePath: string, content: string): string {
  const ext = getFileExtension(filePath);
  const language = getLanguageFromExtension(ext);
  
  return `File: ${filePath}\n\`\`\`${language}\n${content}\n\`\`\`\n`;
}

/**
 * Get file extension from path
 */
export function getFileExtension(filePath: string): string {
  return path.extname(filePath).slice(1);
}

/**
 * Map file extension to language identifier for syntax highlighting
 */
function getLanguageFromExtension(ext: string): string {
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'rb': 'ruby',
    'php': 'php',
    'swift': 'swift',
    'kt': 'kotlin',
    'md': 'markdown',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sql': 'sql',
    'sh': 'bash',
    'bash': 'bash',
  };
  
  return languageMap[ext] || ext;
}
