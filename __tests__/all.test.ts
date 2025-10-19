import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { Input, loadInput } from '../src/input.js';
import { run, workflowConfig } from '../src/lib.js';

const project_dir = __dirname + '/test-cargo-repo';
describe('Workflows', () => {
  test(`should create correct workflow config`, async () => {
    const options = {
      project: project_dir,
      run: ['test', 'clippy'],
      cacheKey: 'no-cache',
      toolchain: 'stable',
      flow: {
        clippy: {
          toolchain: 'nightly',
          denyWarnings: true,
        },
        test: {},
      },
    } as Input;

    const config1 = workflowConfig(options, 'test');
    assert.deepStrictEqual(config1, {
      project: project_dir,
      toolchain: 'stable',
      cacheKey: undefined,
      overrideArgs: undefined,
    });

    const config2 = workflowConfig(options, 'clippy');
    assert.deepEqual(config2, {
      project: project_dir,
      toolchain: 'nightly',
      cacheKey: undefined,
      overrideArgs: undefined,
      denyWarnings: true,
    });
  });

  const config = loadInput();
  for (const wf of Object.keys(config.flow)) {
    test(`should succeed for ${wf}`, async () => {
      const options = structuredClone(config);
      options.project = project_dir;
      options.run = [wf];
      options.cacheKey = 'no-cache';
      options.flow.clippy.toolchain = 'nightly';
      assert.equal(await run(options), true);
    });
  }
});
