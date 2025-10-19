import { info, warning } from '@actions/core';

export function check_sccache() {
  if (!process.env.SCCACHE_PATH) {
    warning(
      'SCCACHE_PATH is not set. Consider using sccache for caching builds. See https://github.com/Mozilla-Actions/sccache-action for more details.',
    );
    return;
  }

  info(`SCCACHE_PATH is set to ${process.env.SCCACHE_PATH}`);

  if (!process.env.RUSTC_WRAPPER) {
    warning(
      'RUSTC_WRAPPER is not set. You may want to set `RUSTC_WRAPPER=sccache` to enable sccache for Rust builds.',
    );
  }
}
