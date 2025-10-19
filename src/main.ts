import { info } from '@actions/core';
import { Cargo } from './cargo.js';
import { loadConfig } from './config.js';
import { run } from './lib.js';

main();

async function main(): Promise<void> {
  const cargo = await Cargo.get();
  info(`Using cargo at path: ${cargo}`);

  const cfg = loadConfig();
  info('Using configuration:' + JSON.stringify(cfg, null, 0));

  run(cargo, cfg);
}
