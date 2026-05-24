import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { GitManager } from '../git.js';
import { ProjectDetector } from '../detector.js';
import { FileManager } from '../manager.js';
import { ConfigManager } from '../config.js';

export const addCommand = new Command('add')
  .argument('<branch>', 'Branch name for the worktree')
  .option('-d, --detach', 'Create detached worktree')
  .option('-f, --force', 'Force creation even if worktree exists')
  .option('-s, --skip-setup', 'Skip project setup commands')
  .description('Create a new worktree for the given branch')
  .action(async (branch: string, options) => {
    try {
      const spinner = ora('Initializing git manager...').start();
      const git = new GitManager();
      const config = new ConfigManager();
      await config.load();

      spinner.text = 'Creating worktree...';
      const worktreePath = git.addWorktree(branch, undefined, {
        detach: options.detach
      });

      spinner.text = 'Detecting project type...';
      const detector = new ProjectDetector();
      const projectType = await detector.detectProject(git.getRepoRoot());

      if (config.get().autoCopy && projectType) {
        spinner.text = 'Copying configuration files...';
        const manager = new FileManager();
        const envFiles = await detector.getEnvFiles(git.getRepoRoot());
        const { copied, skipped } = await manager.copyFiles(
          git.getRepoRoot(),
          worktreePath,
          envFiles
        );

        if (copied.length > 0) {
          console.log(chalk.gray(`  Copied: ${copied.join(', ')}`));
        }
      }

      if (!options.skipSetup && projectType && config.get().defaultHooks) {
        spinner.text = 'Running project setup...';
        const manager = new FileManager();
        await manager.runSetupCommands(worktreePath, projectType.setupCommands);
      }

      spinner.succeed(`Worktree created at ${chalk.cyan(worktreePath)}`);

      console.log('');
      console.log(`  Branch: ${chalk.green(branch)}`);
      console.log(`  Path:   ${chalk.cyan(worktreePath)}`);
      console.log(`  Switch to this worktree:`);
      console.log(`    ${chalk.yellow('cd')} ${worktreePath}`);
    } catch (error) {
      ora().fail(chalk.red(`Failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });