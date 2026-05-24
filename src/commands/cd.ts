import { Command } from 'commander';
import chalk from 'chalk';
import { GitManager } from '../git.js';

export const cdCommand = new Command('cd')
  .argument('[branch]', 'Branch name to switch to (@ for main)')
  .description('Print shell command to switch to a worktree')
  .action(async (branch?: string) => {
    try {
      const git = new GitManager();
      const worktrees = git.listWorktrees();

      if (!branch) {
        const inquirer = await import('inquirer').then(m => m.default);
        const { selected } = await inquirer.prompt([{
          type: 'list',
          name: 'selected',
          message: 'Select worktree:',
          choices: worktrees.map(wt => ({
            name: `${wt.branch} (${formatWorktreePath(wt.worktree, git.getRepoRoot())})`,
            value: wt.worktree
          }))
        }]);

        console.log(`cd ${selected}`);
        return;
      }

      if (branch === '@') {
        const mainWorktree = worktrees.find(wt => wt.isMain);
        if (mainWorktree) {
          console.log(`cd ${mainWorktree.worktree}`);
          return;
        }
      }

      const worktree = worktrees.find(wt => wt.branch === branch);

      if (!worktree) {
        console.error(chalk.red(`Worktree not found: ${branch}`));
        console.log(chalk.gray('Run `wtm list` to see available worktrees'));
        process.exit(1);
      }

      console.log(`cd ${worktree.worktree}`);
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

function formatWorktreePath(worktreePath: string, repoRoot: string): string {
  if (worktreePath === repoRoot) {
    return '(main)';
  }
  return worktreePath;
}