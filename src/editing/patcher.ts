import * as Diff from 'diff';
import * as fs from 'fs/promises';
import * as path from 'path';

export class Patcher {
  private root: string;

  constructor(root: string) {
    this.root = root;
  }

  async applyPatch(filePath: string, patchContent: string): Promise<boolean> {
    const fullPath = path.join(this.root, filePath);

    try {
      const originalContent = await fs.readFile(fullPath, 'utf8');
      
      // Safety: Create backup
      await this.createBackup(filePath, originalContent);

      // Apply patch
      const patchedContent = Diff.applyPatch(originalContent, patchContent);

      if (patchedContent === false) {
        console.error(`Failed to apply patch to ${filePath}. Context mismatch.`);
        return false;
      }

      await fs.writeFile(fullPath, patchedContent, 'utf8');
      return true;

    } catch (error) {
      console.error(`Error patching ${filePath}:`, error);
      return false;
    }
  }

  private async createBackup(filePath: string, content: string) {
    const backupDir = path.join(this.root, '.moth', 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = filePath.replace(/[\\/]/g, '_');
    const backupPath = path.join(backupDir, `${safeName}_${timestamp}.bak`);
    
    await fs.writeFile(backupPath, content, 'utf8');
  }
}
