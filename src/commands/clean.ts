import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { GitManager } from '../git.js';
import fs from 'fs/promises';

export const cleanCommand = new Command('clean')
  .option('-f, --force', 'Remove without confirmation')
  .option('-b, --with-branches', 'Also delete associated branches')
  .description('Remove orphaned worktrees')
  .action(async (options) => {
    try {
      const git = new GitManager();
      const worktrees = git.listWorktrees();

      const orphaned: typeof worktrees = [];

      for (const wt of worktrees) {
        if (wt.isMain) continue;

        try {
          await fs.access(wt.worktree);
        } catch {
          orphaned.push(wt);
        }
      }

      if (orphaned.length === 0) {
        console.log(chalk.green('No orphaned worktrees found'));
        return;
      }

      console.log(chalk.yellow(`Found ${orphaned.length} orphaned worktree${orphaned.length > 1 ? 's' : ''}:`));
      console.log('');

      orphaned.forEach(wt => {
        console.log(`  ${chalk.red('✗')} ${wt.branch} - ${wt.worktree}`);
      });

      console.log('');

      if (!options.force) {
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Remove ${orphaned.length} orphaned worktree${orphaned.length > 1 ? 's' : ''}?`,
            default: false
          }
        ]);

        if (!answers.confirm) {
          console.log(chalk.yellow('Operation cancelled'));
          return;
        }
      }

      const spinner = ora('Cleaning up...').start();

      let removed = 0;
      for (const wt of orphaned) {
        try {
          git.removeWorktree(wt.worktree, { force: true });
          removed++;

          if (options.withBranches) {
            spinner.text = `Deleting branch ${wt.branch}...`;
            try {
              git.deleteBranch(wt.branch, true);
            } catch {
            }
          }
        } catch {
        }
      }

      spinner.succeed(`Removed ${removed} orphaned worktree${removed > 1 ? 's' : ''}`);
    } catch (error) {
      ora().fail(chalk.red(`Failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });