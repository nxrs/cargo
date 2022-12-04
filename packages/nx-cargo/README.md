# @noctifer20/nx-cargo

Fork of [`@nxrs/cargo`](https://github.com/nxrs/cargo) with [wasm-pack](https://rustwasm.github.io/wasm-pack/) support

## Generators

```sh
# @noctifer20/nx-cargo:bin also works
> nx generate @noctifer20/nx-cargo:app my-rust-app
```

```sh
> nx generate @noctifer20/nx-cargo:lib my-rust-lib
```

```sh
> nx generate @noctifer20/nx-cargo:wasm my-rust-wasm-lib
```

## Executors

```sh
# Build a library or binary
> nx build my-rust-app

# Run unit tests in a library
> nx test my-rust-lib

# Check a Rust project with `clippy`
> nx lint my-rust-app
# Don't fail on warnings:
> nx lint my-rust-app --fail-on-warnings false
```

### Options

The executors accept most of the same CLI args as the corresponding `cargo` commands. When in doubt, run with the `--help` flag to see all options with descriptions:

```sh
> nx build my-rust-app --help
```
