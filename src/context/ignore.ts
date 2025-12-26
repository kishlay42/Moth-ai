import ignore from 'ignore';
import * as fs from 'fs';
import * as path from 'path';

export class IgnoreManager {
  private ig = ignore();

  constructor(root: string) {
    this.loadIgnoreFile(root);
    // Always ignore .git and node_modules
    this.ig.add(['.git', 'node_modules', '.moth', 'dist', 'coverage']);
  }

  private loadIgnoreFile(root: string) {
    const ignorePath = path.join(root, '.gitignore');
    if (fs.existsSync(ignorePath)) {
      try {
        const content = fs.readFileSync(ignorePath, 'utf8');
        this.ig.add(content);
      } catch (error) {
        console.warn('Failed to load .gitignore:', error);
      }
    }
  }

  public shouldIgnore(filePath: string): boolean {
    // ignore package expects relative paths
    return this.ig.ignores(filePath);
  }
}
