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
  .option('-c, --create-branch', 'Create the branch if it does not exist')
  .option('-j, --json', 'Output as JSON')
  .description('Create a new worktree for the given branch')
  .action(async (branch: string, options) => {
    try {
      const git = new GitManager();
      const config = new ConfigManager();
      await config.load();

      const spinner = options.json ? null : ora('Creating worktree...').start();

      const worktreePath = git.addWorktree(branch, undefined, {
        detach: options.detach,
        createBranch: options.createBranch
      });

      const detector = new ProjectDetector();
      const projectType = await detector.detectProject(git.getRepoRoot());
      let copied: string[] = [];

      if (config.get().autoCopy && projectType) {
        if (spinner) spinner.text = 'Copying configuration files...';
        const manager = new FileManager();
        const envFiles = await detector.getEnvFiles(git.getRepoRoot());
        const result = await manager.copyFiles(git.getRepoRoot(), worktreePath, envFiles);
        copied = result.copied;
      }

      if (!options.skipSetup && projectType && config.get().defaultHooks) {
        if (spinner) spinner.text = 'Running project setup...';
        const manager = new FileManager();
        await manager.runSetupCommands(worktreePath, projectType.setupCommands);
      }

      if (spinner) {
        spinner.succeed(`Worktree created at ${chalk.cyan(worktreePath)}`);
        console.log('');
        console.log(`  Branch: ${chalk.green(branch)}`);
        console.log(`  Path:   ${chalk.cyan(worktreePath)}`);
        if (copied.length > 0) {
          console.log(`  Copied: ${chalk.gray(copied.join(', '))}`);
        }
        console.log(`  Switch to this worktree:`);
        console.log(`    ${chalk.yellow('cd')} ${worktreePath}`);
      } else {
        console.log(JSON.stringify({
          branch,
          path: worktreePath,
          copied,
          projectType: projectType?.name ?? null
        }, null, 2));
      }
    } catch (error) {
      if (options.json) {
        console.log(JSON.stringify({ error: (error as Error).message }));
      } else {
        ora().fail(chalk.red(`Failed: ${(error as Error).message}`));
      }
      process.exit(1);
    }
  });
