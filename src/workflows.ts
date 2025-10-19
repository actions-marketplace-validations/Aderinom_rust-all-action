import { Cargo } from './cargo';
import { WorkflowConfigSchema } from './config';

// Basic configuration for any workflow
export interface WorkflowConfig extends WorkflowConfigSchema {
  project: string;
  cacheKey?: string;
  toolchain?: string;
  overrideFlags?: string[];
}

// Helper to build cargo command with toolchain and flags
function cargoCommand(
  command: string,
  config: WorkflowConfig,
  defaultFlags: string[],
): string[] {
  const cargoCommand = [] as string[];
  if (config.toolchain) {
    cargoCommand.push(`+${config.toolchain}`);
  }

  cargoCommand.push(command);

  if (config.overrideFlags) {
    cargoCommand.push(...config.overrideFlags);
  } else {
    cargoCommand.push(...defaultFlags);
  }

  return cargoCommand;
}
// Definition of a workflow
interface Workflow {
  readonly name: string;
  readonly run: (cargo: Cargo) => Promise<void>;
}

export class TestWorkflow implements Workflow {
  readonly name = 'test';

  constructor(readonly config: WorkflowConfig) {}

  async run(cargo: Cargo): Promise<void> {
    const cmd = cargoCommand('test', this.config, [
      '--all',
      '--locked',
      '--all-targets',
      '--all-features',
    ]);
    console.log(
      `Executing command: cargo ${cmd.join(' ')}, in directory: ${this.config.project}`,
    );
    await cargo.exec(cmd, { cwd: this.config.project });
  }
  z;
}

export interface ClippyConfig extends WorkflowConfig {
  denyWarnings: boolean;
}
export class ClippyWorkflow implements Workflow {
  readonly name = 'clippy';

  constructor(readonly config: ClippyConfig) {}

  async run(cargo: Cargo): Promise<void> {
    const cmd = cargoCommand('clippy', this.config, [
      '--all',
      '--locked',
      '--all-targets',
      '--all-features',
    ]);
    console.log(
      `Executing command: cargo ${cmd.join(' ')}, in directory: ${this.config.project}`,
    );
    await cargo.exec(cmd, { cwd: this.config.project });
  }
}

export class FormatWorkflow implements Workflow {
  readonly name = 'fmt';

  constructor(readonly config: WorkflowConfig) {}

  async run(cargo: Cargo): Promise<void> {
    const cmd = cargoCommand('fmt', this.config, ['--all', '--', '--check']);
    console.log(
      `Executing command: cargo ${cmd.join(' ')}, in directory: ${this.config.project}`,
    );
    await cargo.exec(cmd, { cwd: this.config.project });
  }
}

export class DocsWorkflow implements Workflow {
  readonly name = 'doc';

  constructor(readonly config: WorkflowConfig) {}

  async run(cargo: Cargo): Promise<void> {
    const cmd = cargoCommand('doc', this.config, [
      '--all',
      '--locked',
      '--no-deps',
    ]);
    console.log(
      `Executing command: cargo ${cmd.join(' ')}, in directory: ${this.config.project}`,
    );
    await cargo.exec(cmd, { cwd: this.config.project });
  }
}

export class ShearWorkflow implements Workflow {
  readonly name = 'shear';

  constructor(readonly config: WorkflowConfig) {}

  async run(cargo: Cargo): Promise<void> {
    await cargo.binstall('cargo-shear', 'latest', this.config.cacheKey);
    const cmd = cargoCommand('shear', this.config, []);
    console.log(
      `Executing command: cargo ${cmd.join(' ')}, in directory: ${this.config.project}`,
    );
    await cargo.exec(cmd, { cwd: this.config.project });
  }
}



export class DenyWorkflow implements Workflow {
  readonly name = 'deny';

  constructor(readonly config: WorkflowConfig) {}

  async run(cargo: Cargo): Promise<void> {
    await cargo.binstall('cargo-deny', 'latest', this.config.cacheKey);
    const cmd = cargoCommand('deny', this.config, ['check']);
    console.log(
      `Executing command: cargo ${cmd.join(' ')}, in directory: ${this.config.project}`,
    );
    await cargo.exec(cmd, { cwd: this.config.project });
  }
}
