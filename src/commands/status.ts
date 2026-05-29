import { Command } from 'commander';
import chalk from 'chalk';
import { GitManager } from '../git.js';

export const statusCommand = new Command('status')
  .alias('st')
  .option('-j, --json', 'Output as JSON')
  .description('Show status of all worktrees')
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

      const statuses = worktrees.map(wt => {
        const status = git.getWorktreeStatus(wt.worktree);
        return { ...wt, status };
      });

      if (options.json) {
        console.log(JSON.stringify({ worktrees: statuses }, null, 2));
        return;
      }

      console.log('');
      for (const wt of statuses) {
        const label = wt.isMain ? chalk.green('●') : '○';
        const branch = chalk.blue(wt.branch);
        const short = wt.commit.substring(0, 7);

        const parts: string[] = [];
        if (wt.status.staged > 0) parts.push(chalk.yellow(`${wt.status.staged} staged`));
        if (wt.status.untracked > 0) parts.push(chalk.red(`${wt.status.untracked} unstaged`));
        if (wt.status.ahead > 0) parts.push(chalk.green(`↑${wt.status.ahead}`));
        if (wt.status.behind > 0) parts.push(chalk.red(`↓${wt.status.behind}`));

        const statusStr = parts.length > 0 ? parts.join(' ') : chalk.gray('clean');

        console.log(`  ${label} ${branch} ${chalk.gray(short)}  ${statusStr}`);
      }
      console.log('');
    } catch (error) {
      if (options.json) {
        console.log(JSON.stringify({ error: (error as Error).message }));
      } else {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
      }
      process.exit(1);
    }
  });
