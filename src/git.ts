import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import type { WorktreeInfo } from './types.js';

export class GitManager {
  private repoRoot: string;

  constructor(cwd: string = process.cwd()) {
    this.repoRoot = this.findGitRootSync(cwd);
  }

  private findGitRootSync(startDir: string): string {
    let currentDir = startDir;
    const root = path.parse(startDir).root;

    while (currentDir !== root) {
      const gitDir = path.join(currentDir, '.git');
      try {
        const stats = fs.statSync(gitDir);
        if (stats.isDirectory() || stats.isSymbolicLink()) {
          return currentDir;
        }
      } catch {
        // Not a git directory
      }

      currentDir = path.dirname(currentDir);
    }

    throw new Error('Not a git repository');
  }

  getRepoRoot(): string {
    return this.repoRoot;
  }

  listWorktrees(): WorktreeInfo[] {
    try {
      const output = execSync('git worktree list --porcelain', {
        cwd: this.repoRoot,
        encoding: 'utf-8'
      }).trim();

      const worktrees: WorktreeInfo[] = [];
      let current: Partial<WorktreeInfo> = {};

      for (const line of output.split('\n')) {
        if (line.startsWith('worktree ')) {
          if (current.worktree) {
            worktrees.push(current as WorktreeInfo);
          }
          current = { worktree: line.substring(9) };
        } else if (line.startsWith('branch ')) {
          current.branch = line.substring(7).replace('refs/heads/', '');
          current.isMain = current.worktree === this.repoRoot;
        } else if (line.startsWith('commit ')) {
          current.commit = line.substring(7);
        }
      }

      if (current.worktree) {
        worktrees.push(current as WorktreeInfo);
      }

      return worktrees;
    } catch (error) {
      throw new Error(`Failed to list worktrees: ${(error as Error).message}`);
    }
  }

  addWorktree(branch: string, dest?: string, options: { detach?: boolean } = {}): string {
    const worktrees = this.listWorktrees();
    const existing = worktrees.find(w => w.branch === branch);

    if (existing) {
      throw new Error(`Worktree for branch '${branch}' already exists at ${existing.worktree}`);
    }

    const branchExists = this.branchExists(branch);
    if (!branchExists) {
      throw new Error(`Branch '${branch}' does not exist. Create it first with 'git checkout -b ${branch}'`);
    }

    const worktreePath = dest || this.generateWorktreePath(branch);

    try {
      const args = ['add', worktreePath];
      if (options.detach) {
        args.push('--detach');
      }
      args.push(branch);

      execSync(`git worktree ${args.join(' ')}`, { cwd: this.repoRoot, stdio: 'pipe' });

      return worktreePath;
    } catch (error) {
      throw new Error(`Failed to add worktree: ${(error as Error).message}`);
    }
  }

  removeWorktree(worktreePath: string, options: { force?: boolean } = {}): void {
    try {
      const args = ['remove', worktreePath];
      if (options.force) {
        args.push('--force');
      }

      execSync(`git worktree ${args.join(' ')}`, { cwd: this.repoRoot, stdio: 'pipe' });
    } catch (error) {
      throw new Error(`Failed to remove worktree: ${(error as Error).message}`);
    }
  }

  deleteBranch(branch: string, force: boolean = false): void {
    try {
      const forceFlag = force ? '-D' : '-d';
      execSync(`git branch ${forceFlag} ${branch}`, { cwd: this.repoRoot, stdio: 'pipe' });
    } catch (error) {
      throw new Error(`Failed to delete branch: ${(error as Error).message}`);
    }
  }

  getCurrentBranch(): string {
    try {
      const output = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.repoRoot,
        encoding: 'utf-8'
      }).trim();
      return output;
    } catch (error) {
      throw new Error(`Failed to get current branch: ${(error as Error).message}`);
    }
  }

  private branchExists(branch: string): boolean {
    try {
      execSync(`git show-ref --verify --quiet refs/heads/${branch}`, {
        cwd: this.repoRoot,
        stdio: 'pipe'
      });
      return true;
    } catch {
      return false;
    }
  }

  private generateWorktreePath(branch: string): string {
    const branchName = branch.replace(/^origin\//, '');
    return path.join(this.repoRoot, '..', 'worktrees', branchName);
  }
}