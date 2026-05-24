# worktree-manager

Zero-config CLI for git worktree management with intelligent automation.

## Features

- **Zero-config**: Works out of the box, no setup required
- **Intelligent automation**: Automatically copies dependencies and environment files
- **Interactive commands**: User-friendly prompts for common operations
- **Smart path generation**: Automatically generates worktree paths based on branch names
- **Worktree cleanup**: Detects and removes stale worktrees
- **Branch management**: Create, list, remove worktrees with branch awareness

## Installation

```bash
npm install -g worktree-manager
```

## Usage

### Add a new worktree

```bash
wtm add <branch>
```

Options:
- `-d, --detach`: Create a detached worktree
- `-f, --force`: Force creation even if worktree exists
- `-s, --skip-setup`: Skip automatic dependency copying

### List all worktrees

```bash
wtm list
```

Options:
- `-v, --verbose`: Show detailed information

### Remove a worktree

```bash
wtm remove <path>
```

Options:
- `-b, --with-branch`: Also delete the associated branch
- `-f, --force`: Force removal

### Change directory to a worktree

```bash
wtm cd <branch>
```

### Clean stale worktrees

```bash
wtm clean
```

### Configure worktree-manager

```bash
wtm config
```

## Examples

```bash
# Add a worktree for a feature branch
wtm add feature/new-ui

# Add with detached HEAD
wtm add --detach hotfix/bug-123

# List all worktrees with details
wtm list --verbose

# Remove a worktree and its branch
wtm remove --with-branch feature/old-feature

# Clean up stale worktrees
wtm clean

# Change to a worktree directory
wtm cd develop
```

## How It Works

worktree-manager wraps `git worktree` commands with additional automation:

1. **Automatic dependency detection**: Detects Node.js, Python, and other project types
2. **Smart file copying**: Copies package.json, requirements.txt, .env files, etc.
3. **Environment setup**: Runs project-specific setup commands
4. **Path generation**: Creates organized worktree directories (e.g., `../worktrees/branch-name`)

## Requirements

- Node.js >= 18.0.0
- Git 2.5+ (with worktree support)

## License

MIT