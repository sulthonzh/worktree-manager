import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { GitManager } from '../git.js';

export const removeCommand = new Command('remove')
  .alias('rm')
  .argument('<path>', 'Path or branch name of the worktree to remove')
  .option('-b, --with-branch', 'Also delete the branch')
  .option('-f, --force', 'Force removal without confirmation')
  .description('Remove a worktree')
  .action(async (target: string, options) => {
    try {
      const git = new GitManager();
      const worktrees = git.listWorktrees();

      const worktree = worktrees.find(
        wt => wt.worktree === target || wt.branch === target
      );

      if (!worktree) {
        console.error(chalk.red(`Worktree not found: ${target}`));
        process.exit(1);
      }

      if (worktree.isMain) {
        console.error(chalk.red('Cannot remove the main worktree'));
        process.exit(1);
      }

      if (!options.force) {
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Remove worktree at ${formatWorktreePath(worktree.worktree, git.getRepoRoot())}?`,
            default: false
          }
        ]);

        if (!answers.confirm) {
          console.log(chalk.yellow('Operation cancelled'));
          return;
        }

        if (options.withBranch) {
          const branchAnswers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirmBranch',
              message: `Also delete branch ${chalk.blue(worktree.branch)}?`,
              default: false
            }
          ]);

          if (!branchAnswers.confirmBranch) {
            options.withBranch = false;
          }
        }
      }

      const spinner = ora(`Removing worktree...`).start();

      git.removeWorktree(worktree.worktree, { force: options.force });

      if (options.withBranch) {
        spinner.text = `Deleting branch ${worktree.branch}...`;
        git.deleteBranch(worktree.branch, true);
      }

      spinner.succeed(`Worktree removed successfully`);

      if (options.withBranch) {
        console.log(`  Branch ${chalk.blue(worktree.branch)} deleted`);
      }
    } catch (error) {
      ora().fail(chalk.red(`Failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

function formatWorktreePath(worktreePath: string, repoRoot: string): string {
  if (worktreePath === repoRoot) {
    return '(main)';
  }
  return worktreePath;
}