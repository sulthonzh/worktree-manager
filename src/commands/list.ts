import path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import { GitManager } from '../git.js';

export const listCommand = new Command('list')
  .alias('ls')
  .option('-v, --verbose', 'Show detailed information')
  .option('-j, --json', 'Output as JSON')
  .description('List all worktrees')
  .action(async (options) => {
    try {
      const git = new GitManager();
      const worktrees = git.listWorktrees();

      if (worktrees.length === 0) {
        if (options.json) {
          console.log(JSON.stringify({ worktrees: [] }));
        } else {
          console.log(chalk.yellow('No worktrees found.'));
        }
        return;
      }

      if (options.json) {
        console.log(JSON.stringify({ worktrees }, null, 2));
        return;
      }

      const currentBranch = git.getCurrentBranch();

      console.log('');
      worktrees.forEach((wt) => {
        const isCurrent = wt.branch === currentBranch;
        const branchLabel = isCurrent ? chalk.green('* ') : '  ';
        const pathLabel = chalk.cyan(formatWorktreePath(wt.worktree, git.getRepoRoot()));
        const branchName = chalk.blue(formatBranch(wt.branch, wt.isMain));

        console.log(`${branchLabel}${pathLabel}`);
        console.log(`    ${branchName}  ${chalk.gray(wt.commit.substring(0, 7))}`);

        if (options.verbose) {
          console.log(`    ${chalk.gray(wt.worktree)}`);
        }
      });

      console.log('');
      console.log(chalk.gray(`Total: ${worktrees.length} worktree${worktrees.length > 1 ? 's' : ''}`));
    } catch (error) {
      if (options.json) {
        console.log(JSON.stringify({ error: (error as Error).message }));
      } else {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
      }
      process.exit(1);
    }
  });

function formatWorktreePath(worktreePath: string, repoRoot: string): string {
  if (worktreePath === repoRoot) {
    return '(main)';
  }
  const relative = path.relative(process.cwd(), worktreePath);
  if (relative.startsWith('..')) {
    return worktreePath;
  }
  return relative;
}

function formatBranch(branch: string, isMain: boolean = false): string {
  if (isMain) {
    return `${branch} (main)`;
  }
  return branch;
}
