import { info } from 'node:console';
import { Cargo } from './cargo';
import { FlowConfig } from './lib';

// Definition of a workflow
interface Workflow {
  readonly name: string;
  readonly run: () => Promise<void>;
  // List of required tools as [tool, version] tuples to ensure before running
  readonly requiredTools: [string, string][];
}

export class TestWorkflow implements Workflow {
  readonly name = 'test';
  readonly requiredTools: [string, string][] = [];

  constructor(readonly config: FlowConfig<'test'>) {}

  async run(): Promise<void> {
    const args = ['--all', '--locked', '--all-targets', '--all-features'];

    if (!this.config.failFast) {
      args.push('--no-fail-fast');
    }

    const cmd = cargoCommand('test', this.config, args);
    info(
      `Executing command: cargo ${cmd.join(' ')}, in directory: ${this.config.project}`,
    );
    await Cargo.exec(cmd, { cwd: this.config.project });
  }
}

export class ClippyWorkflow implements Workflow {
  readonly name = 'clippy';
  readonly requiredTools: [string, string][] = [];

  constructor(readonly config: FlowConfig<'clippy'>) {}

  async run(): Promise<void> {
    const cmd = cargoCommand('clippy', this.config, [
      '--all',
      '--locked',
      '--all-targets',
      '--all-features',
    ]);
    info(
      `Executing command: cargo ${cmd.join(' ')}, in directory: ${this.config.project}`,
    );
    await Cargo.exec(cmd, { cwd: this.config.project });
  }
}

export class FormatWorkflow implements Workflow {
  readonly name = 'fmt';
  readonly requiredTools: [string, string][] = [];

  constructor(readonly config: FlowConfig<'fmt'>) {}

  async run(): Promise<void> {
    const cmd = cargoCommand('fmt', this.config, ['--all', '--', '--check']);
    info(
      `Executing command: cargo ${cmd.join(' ')}, in directory: ${this.config.project}`,
    );
    await Cargo.exec(cmd, { cwd: this.config.project });
  }
}

export class DocsWorkflow implements Workflow {
  readonly name = 'doc';
  readonly requiredTools: [string, string][] = [];

  constructor(readonly config: FlowConfig<'doc'>) {}

  async run(): Promise<void> {
    const cmd = cargoCommand('doc', this.config, [
      '--all',
      '--locked',
      '--no-deps',
    ]);
    info(
      `Executing command: cargo ${cmd.join(' ')}, in directory: ${this.config.project}`,
    );
    await Cargo.exec(cmd, { cwd: this.config.project });
  }
}

export class ShearWorkflow implements Workflow {
  readonly name = 'shear';
  readonly requiredTools: [string, string][] = [['cargo-shear', 'latest']];

  constructor(readonly config: FlowConfig<'shear'>) {}

  async run(): Promise<void> {
    const cmd = cargoCommand('shear', this.config, []);
    info(
      `Executing command: cargo ${cmd.join(' ')}, in directory: ${this.config.project}`,
    );
    await Cargo.exec(cmd, { cwd: this.config.project });
  }
}

export class DenyWorkflow implements Workflow {
  readonly name = 'deny';
  readonly requiredTools: [string, string][] = [['cargo-deny', 'latest']];

  constructor(readonly config: FlowConfig<'deny'>) {}

  async run(): Promise<void> {
    const cmd = cargoCommand('deny', this.config, ['check']);
    info(
      `Executing command: 'cargo ${cmd.join(' ')}', in directory: ${this.config.project}`,
    );
    await Cargo.exec(cmd, { cwd: this.config.project });
  }
}

// Helper to build cargo command with toolchain and flags
function cargoCommand(
  command: string,
  config: {
    toolchain?: string;
    overrideArgs?: string[];
  },
  args: string[],
): string[] {
  const cargoCommand = [] as string[];
  if (config.toolchain) {
    cargoCommand.push(`+${config.toolchain}`);
  }

  cargoCommand.push(command);

  if (config.overrideArgs) {
    cargoCommand.push(...config.overrideArgs);
  } else {
    cargoCommand.push(...args);
  }

  return cargoCommand;
}
