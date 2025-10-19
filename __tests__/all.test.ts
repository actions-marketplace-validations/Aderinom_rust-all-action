import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { Cargo } from '../src/cargo.js';
import { defaultConfig, loadConfig } from '../src/config.js';
import { run, workflowConfig } from '../src/lib.js';
import { ClippyConfig, WorkflowConfig } from '../src/workflows.js';

const project_dir = __dirname + '/test-cargo-repo';
describe('Workflows', () => {
  test(`should create correct workflow config`, async () => {
    const options = structuredClone(defaultConfig);
    options.project = project_dir;
    options.toolchain = 'stable';
    options.cacheKey = 'no-cache';
    options.flow.clippy.toolchain = 'nightly';
    options.flow.clippy.denyWarnings = true;


    const config1: WorkflowConfig = workflowConfig(options, 'test');
    assert.equal(config1.toolchain, 'stable');
    assert.equal(config1.project, project_dir);
    assert.equal(config1.cacheKey, undefined);
    assert.deepEqual(config1.overrideArgs, []);

    const config2: ClippyConfig = workflowConfig(options, 'clippy');
    assert.equal(config2.toolchain, 'nightly');
    assert.equal(config2.project, project_dir);
    assert.equal(config2.cacheKey, undefined);
    assert.deepEqual(config2.overrideArgs, []);
    assert.equal(config2.denyWarnings, true);
  });

  for (const wf of Object.keys(defaultConfig.flow)) {
    test(`should succeed for ${wf}`, async () => {
      const cargo = await Cargo.get();
      const options = structuredClone(defaultConfig);
      options.project = project_dir;
      options.run = [wf];
      options.cacheKey = 'no-cache';
      options.flow.clippy.toolchain = 'nightly';
      assert.equal(await run(cargo, options), true);
    });
  }
});

describe('Config Loading', () => {
test('should correctly load config env', () => {
  const env = {
    RAX_project: './workspace',
    RAX_cacheKey: 'no-cache',
    RAX_run: 'test,clippy',
    RAX_toolchain: 'stable',
    RAX_flow_clippy_denyWarnings: 'false',
    RAX_flow_clippy_toolchain: 'nightly',
    RAX_flow_test_overrideArgs: '--all-features --release',
  };

  const cfg = loadConfig(env);

  // assert.equal(cfg.project, './workspace');
  assert.equal(cfg.cacheKey, 'no-cache');
  assert.deepEqual(cfg.run, ['test', 'clippy']);
  assert.equal(cfg.toolchain, 'stable');
  assert.equal(cfg.flow.clippy.denyWarnings, false);
  assert.equal(cfg.flow.clippy.toolchain, 'nightly');
  assert.deepEqual(cfg.flow.test.overrideArgs, '--all-features --release');
  assert.equal(cfg.flow.test.toolchain, 'stable');
});
});
