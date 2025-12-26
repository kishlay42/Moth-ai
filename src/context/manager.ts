import { ProjectScanner } from './scanner.js';
import { FileContext, ContextRequest, ContextResult } from './types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ContextManager {
  private scanner: ProjectScanner;
  private root: string;

  constructor(root: string) {
    this.root = root;
    this.scanner = new ProjectScanner(root);
  }

  async gather(request: ContextRequest): Promise<ContextResult> {
    const filePaths = await this.scanner.scan();
    const files: FileContext[] = [];

    // Simple Scoring: 
    // 1. Exact filename match (1.0)
    // 2. Query terms in path (0.5)
    // 3. Default (0.1)
    
    // Normalize query terms
    const terms = request.query.toLowerCase().split(/\s+/);

    for (const filePath of filePaths) {
      let score = 0.1;
      const lowerPath = filePath.toLowerCase();
      const basename = path.basename(lowerPath);

      if (terms.some(t => basename === t)) {
        score = 1.0;
      } else if (terms.some(t => lowerPath.includes(t))) {
        score = 0.5;
      }

      // Basic Tiering Logic (Placeholder)
      // If score > 0.8 => Full
      // If score > 0.4 => Summary (but we don't have summarizer yet, so Path)
      // Else => Path
      
      let tier: 'path' | 'summary' | 'full' = 'path';
      let content: string | undefined;

      if (score >= 0.8) {
        tier = 'full';
        try {
          // Limit file read size for safety
          content = await fs.readFile(path.join(this.root, filePath), 'utf8');
          // Truncate if too huge? (TODO)
        } catch (e) {
          console.warn(`Failed to read ${filePath}`, e);
          tier = 'path';
        }
      }

      files.push({
        path: filePath,
        relevance: score,
        tier,
        content
      });
    }

    // Sort by relevance
    files.sort((a, b) => b.relevance - a.relevance);

    return {
      files,
      totalTokens: 0 // Placeholder
    };
  }
}
