export interface WorktreeInfo {
  worktree: string;
  branch: string;
  commit: string;
  isMain?: boolean;
}

export interface Config {
  baseDir: string;
  autoCopy: boolean;
  defaultHooks: boolean;
  filesToCopy: string[];
}

export interface ProjectType {
  name: string;
  language: string;
  setupCommands: string[];
  dependencyFiles: string[];
  envFiles: string[];
}

export interface AddOptions {
  detach?: boolean;
  force?: boolean;
  skipSetup?: boolean;
}

export interface RemoveOptions {
  withBranch?: boolean;
  force?: boolean;
}