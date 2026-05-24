import fs from 'fs/promises';
import path from 'path';
import * as os from 'os';
import type { Config } from './types.js';

const DEFAULT_CONFIG: Config = {
  baseDir: '../worktrees',
  autoCopy: true,
  defaultHooks: true,
  filesToCopy: ['.env', '.env.local', '.gitignore', '.editorconfig']
};

export class ConfigManager {
  private configPath: string;
  private config: Config;

  constructor() {
    const configDir = path.join(os.homedir(), '.worktree-manager');
    this.configPath = path.join(configDir, 'config.json');
    this.config = { ...DEFAULT_CONFIG };
  }

  async load(): Promise<void> {
    try {
      const configContent = await fs.readFile(this.configPath, 'utf-8');
      const loadedConfig = JSON.parse(configContent) as Partial<Config>;
      this.config = { ...DEFAULT_CONFIG, ...loadedConfig };
    } catch (error) {
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  async save(): Promise<void> {
    try {
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      throw new Error(`Failed to save config: ${(error as Error).message}`);
    }
  }

  get(): Config {
    return { ...this.config };
  }

  set(key: keyof Config, value: any): void {
    (this.config as any)[key] = value;
  }

  getBaseDir(repoRoot: string): string {
    const baseDir = path.isAbsolute(this.config.baseDir)
      ? this.config.baseDir
      : path.resolve(path.join(repoRoot, this.config.baseDir));
    return baseDir;
  }
}