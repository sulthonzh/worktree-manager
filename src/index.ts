#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { cdCommand } from './commands/cd.js';
import { cleanCommand } from './commands/clean.js';
import { configCommand } from './commands/config.js';

const program = new Command();

program
  .name('wtm')
  .description('Zero-config CLI for git worktree management')
  .version('1.0.0');

program.addCommand(addCommand);
program.addCommand(listCommand);
program.addCommand(removeCommand);
program.addCommand(cdCommand);
program.addCommand(cleanCommand);
program.addCommand(configCommand);

program.parse(process.argv);