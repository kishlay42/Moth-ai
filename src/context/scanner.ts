import * as fs from 'fs/promises';
import * as path from 'path';
import { IgnoreManager } from './ignore.js';

export class ProjectScanner {
  private root: string;
  private ignoreManager: IgnoreManager;

  constructor(root: string) {
    this.root = root;
    this.ignoreManager = new IgnoreManager(root);
  }

  async scan(): Promise<string[]> {
    const files: string[] = [];
    await this.scanDir('', files);
    return files;
  }

  private async scanDir(relativeDir: string, fileList: string[]) {
    const fullDir = path.join(this.root, relativeDir);
    
    // Check if directory itself is ignored
    if (relativeDir && this.ignoreManager.shouldIgnore(relativeDir)) {
      return;
    }

    try {
      const entries = await fs.readdir(fullDir, { withFileTypes: true });

      for (const entry of entries) {
        const relativePath = path.join(relativeDir, entry.name);

        if (this.ignoreManager.shouldIgnore(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.scanDir(relativePath, fileList);
        } else if (entry.isFile()) {
          fileList.push(relativePath);
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${fullDir}:`, error);
    }
  }
}
