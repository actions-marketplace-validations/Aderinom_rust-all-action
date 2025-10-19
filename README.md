
# Rust All Action

Simple GitHub Action to run multiple Rust workflows.  
Including: `test`, `clippy`, `fmt`, `doc`, and `shear`.  

Designed as a baseline CI for Rust projects.

By default:

- Caches installed tools between runs
- Supports workflow-specific toolchain and argument overrides

To cache compilation between runs, use [sccache](https://github.com/Mozilla-Actions/sccache-action)

---

## Usage

To run all default workflows just add:

```yaml
jobs:
  rust-all:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aderinom/rust-all-action@v1
      - uses: aderinom/rust-all-action@v1
        with:
          run: 'deny'
```

If you prefer running all jobs in parallel, use following config:

``` yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aderinom/rust-all-action@v1
        with:
          run: 'test, clippt'

  fmt:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aderinom/rust-all-action@v1
        with:
          run: 'fmt'

  doc:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aderinom/rust-all-action@v1
        with:
          run: 'doc'

  shear:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aderinom/rust-all-action@v1
        with:
          run: 'shear'

```

## Inputs

| Input       | Description                                               | Default                     |
| ----------- | --------------------------------------------------------- | --------------------------- |
| `project`   | Path to Rust project.                                     | `./`                        |
| `cacheKey`  | Cache key for installed tools. Use `no-cache` to disable. | `rax-installed`             |
| `run`       | Comma-separated list of workflows to execute.             | `test,clippy,doc,fmt,shear` |
| `toolchain` | Default Rust toolchain.                                   | *(none)*                    |

### Workflow Overrides

Each workflow supports `toolchain` and `overrideArgs` inputs.
`clippy` also supports `denyWarnings`.

| Workflow | Input                      | Description                    | Example                       |
| -------- | -------------------------- | ------------------------------ | ----------------------------- |
| `test`   | `flow-test-toolchain`      | Override toolchain for tests.  | `nightly`                     |
|          | `flow-test-overrideArgs`   | args for `cargo test`.         | `--all-features --release`    |

## Contributing

Contributions are welcome. If you’d like to add another workflow or adjust existing behavior, fork the repository and open a pull request.

### Setup

```bash
pnpm i
````

This installs all dependencies and development tooling.

### Testing

The repository includes a minimal Rust cargo project used for integration tests.
Tests are executed against this local project to validate configuration parsing and workflow behavior.

Run tests with:

```bash
pnpm test
```

All tests use the native Node.js test runner (`node:test`) and strict assertions from `node:assert/strict`.
