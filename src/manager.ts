import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class FileManager {
  async copyFiles(
    sourceDir: string,
    targetDir: string,
    filesToCopy: string[]
  ): Promise<{ copied: string[]; skipped: string[] }> {
    const copied: string[] = [];
    const skipped: string[] = [];

    for (const file of filesToCopy) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);

      try {
        await fs.access(sourcePath);

        const targetExists = await this.fileExists(targetPath);

        if (targetExists) {
          skipped.push(file);
          continue;
        }

        await fs.copyFile(sourcePath, targetPath);
        copied.push(file);
      } catch (error) {
        skipped.push(file);
      }
    }

    return { copied, skipped };
  }

  async runSetupCommands(dir: string, commands: string[]): Promise<void> {
    for (const cmd of commands) {
      try {
        await execAsync(cmd, { cwd: dir });
      } catch (error) {
        console.warn(`Warning: Setup command failed: ${cmd}`);
      }
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async ensureDir(dir: string): Promise<void> {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dir}: ${(error as Error).message}`);
    }
  }
}