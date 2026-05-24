import fs from 'fs/promises';
import path from 'path';
import type { ProjectType } from './types.js';

export class ProjectDetector {
  private projectTypes: ProjectType[] = [
    {
      name: 'Node.js',
      language: 'node',
      setupCommands: ['npm ci', 'npm install'],
      dependencyFiles: ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
      envFiles: ['.env', '.env.local', '.env.example']
    },
    {
      name: 'Python',
      language: 'python',
      setupCommands: ['pip install -r requirements.txt'],
      dependencyFiles: ['requirements.txt', 'setup.py', 'pyproject.toml', 'poetry.lock'],
      envFiles: ['.env', '.env.example', '.flaskenv']
    },
    {
      name: 'Go',
      language: 'go',
      setupCommands: ['go mod download'],
      dependencyFiles: ['go.mod', 'go.sum'],
      envFiles: ['.env', '.env.example']
    },
    {
      name: 'Rust',
      language: 'rust',
      setupCommands: ['cargo fetch'],
      dependencyFiles: ['Cargo.toml', 'Cargo.lock'],
      envFiles: ['.env', '.env.example']
    }
  ];

  async detectProject(dir: string): Promise<ProjectType | null> {
    for (const projectType of this.projectTypes) {
      if (await this.matchesProjectType(dir, projectType)) {
        return projectType;
      }
    }
    return null;
  }

  private async matchesProjectType(dir: string, projectType: ProjectType): Promise<boolean> {
    for (const file of projectType.dependencyFiles) {
      try {
        const filePath = path.join(dir, file);
        await fs.access(filePath);
        return true;
      } catch {
        continue;
      }
    }
    return false;
  }

  async getEnvFiles(dir: string): Promise<string[]> {
    const allEnvFiles = new Set<string>();

    for (const projectType of this.projectTypes) {
      for (const envFile of projectType.envFiles) {
        try {
          const filePath = path.join(dir, envFile);
          await fs.access(filePath);
          allEnvFiles.add(envFile);
        } catch {
          continue;
        }
      }
    }

    return Array.from(allEnvFiles);
  }
}