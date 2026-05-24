import { Command } from 'commander';
import chalk from 'chalk';

export const configCommand = new Command('config')
  .description('Manage worktree-manager configuration');

configCommand
  .command('get')
  .description('Show current configuration')
  .action(async () => {
    const { ConfigManager } = await import('../config.js');
    const { GitManager } = await import('../git.js');

    const git = new GitManager();
    const config = new ConfigManager();
    await config.load();

    const cfg = config.get();

    console.log('');
    console.log(chalk.bold('Configuration:'));
    console.log('');
    console.log(`  baseDir:          ${chalk.cyan(cfg.baseDir)}`);
    console.log(`  autoCopy:         ${cfg.autoCopy ? chalk.green('true') : chalk.red('false')}`);
    console.log(`  defaultHooks:     ${cfg.defaultHooks ? chalk.green('true') : chalk.red('false')}`);
    console.log(`  filesToCopy:      ${chalk.cyan(cfg.filesToCopy.join(', '))}`);
    console.log('');
  });

configCommand
  .command('set <key> <value>')
  .description('Set a configuration value')
  .action(async (key: string, value: string) => {
    const { ConfigManager } = await import('../config.js');
    const { GitManager } = await import('../git.js');

    const git = new GitManager();
    const config = new ConfigManager();
    await config.load();

    const validKeys = ['baseDir', 'autoCopy', 'defaultHooks'];

    if (!validKeys.includes(key)) {
      console.error(chalk.red(`Invalid config key: ${key}`));
      console.log(chalk.gray(`Valid keys: ${validKeys.join(', ')}`));
      process.exit(1);
    }

    let parsedValue: any = value;
    if (value === 'true') parsedValue = true;
    if (value === 'false') parsedValue = false;

    config.set(key as any, parsedValue);
    await config.save();

    console.log(chalk.green(`Set ${key} = ${parsedValue}`));
  });