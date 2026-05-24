import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitManager } from '../src/git.js';
import { execSync } from 'child_process';
import fs from 'fs';

vi.mock('child_process');
vi.mock('fs');

describe('GitManager', () => {
  let gitManager: GitManager;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fs.statSync to return a directory for .git
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as fs.Stats);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('findGitRootSync', () => {
    it('should find git root directory', () => {
      vi.mocked(execSync).mockReturnValue('/test/repo/.git' as any);
      
      gitManager = new GitManager('/test/repo');
      
      expect(gitManager.getRepoRoot()).toBe('/test/repo');
    });

    it('should throw error if not in a git repository', () => {
      vi.mocked(fs.statSync).mockImplementation(() => {
        throw new Error('Not found');
      });
      
      expect(() => new GitManager('/test/non-repo')).toThrow('Not a git repository');
    });
  });

  describe('listWorktrees', () => {
    it('should list all worktrees', () => {
      const mockOutput = `worktree /test/repo
branch refs/heads/main
commit abc123

worktree /test/worktrees/feature
branch refs/heads/feature
commit def456`;

      vi.mocked(execSync).mockReturnValue(mockOutput as any);
      gitManager = new GitManager('/test/repo');

      const worktrees = gitManager.listWorktrees();

      expect(worktrees).toHaveLength(2);
      expect(worktrees[0]).toMatchObject({
        worktree: '/test/repo',
        branch: 'main',
        commit: 'abc123',
        isMain: true
      });
      expect(worktrees[1]).toMatchObject({
        worktree: '/test/worktrees/feature',
        branch: 'feature',
        commit: 'def456',
        isMain: false
      });
    });

    it('should throw error if git command fails', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Git command failed');
      });

      gitManager = new GitManager('/test/repo');

      expect(() => gitManager.listWorktrees()).toThrow('Failed to list worktrees');
    });
  });

  describe('getCurrentBranch', () => {
    it('should get current branch name', () => {
      vi.mocked(execSync).mockReturnValue('feature-branch' as any);
      gitManager = new GitManager('/test/repo');

      const branch = gitManager.getCurrentBranch();

      expect(branch).toBe('feature-branch');
    });
  });

  describe('addWorktree', () => {
    it('should add a new worktree', () => {
      const mockWorktrees = [
        { worktree: '/test/repo', branch: 'main', commit: 'abc123', isMain: true }
      ];

      vi.mocked(execSync).mockImplementation((cmd: string) => {
        if (cmd.includes('worktree list')) {
          return 'worktree /test/repo\nbranch refs/heads/main\ncommit abc123' as any;
        }
        if (cmd.includes('show-ref')) {
          return '' as any;
        }
        return '' as any;
      });

      gitManager = new GitManager('/test/repo');

      const result = gitManager.addWorktree('feature-branch', '/test/worktrees/feature');

      expect(result).toBe('/test/worktrees/feature');
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('git worktree add'),
        expect.any(Object)
      );
    });

    it('should throw error if worktree already exists', () => {
      vi.mocked(execSync).mockImplementation((cmd: string) => {
        if (cmd.includes('worktree list')) {
          return `worktree /test/repo
branch refs/heads/main
commit abc123

worktree /test/worktrees/feature
branch refs/heads/feature-branch
commit def456` as any;
        }
        return '' as any;
      });

      gitManager = new GitManager('/test/repo');

      expect(() => gitManager.addWorktree('feature-branch')).toThrow('already exists');
    });
  });

  describe('removeWorktree', () => {
    it('should remove a worktree', () => {
      vi.mocked(execSync).mockReturnValue('' as any);
      gitManager = new GitManager('/test/repo');

      gitManager.removeWorktree('/test/worktrees/feature');

      expect(execSync).toHaveBeenCalledWith(
        'git worktree remove /test/worktrees/feature',
        expect.any(Object)
      );
    });

    it('should remove with force flag', () => {
      vi.mocked(execSync).mockReturnValue('' as any);
      gitManager = new GitManager('/test/repo');

      gitManager.removeWorktree('/test/worktrees/feature', { force: true });

      expect(execSync).toHaveBeenCalledWith(
        'git worktree remove /test/worktrees/feature --force',
        expect.any(Object)
      );
    });
  });
});