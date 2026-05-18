# Rust Benchmarks

Run the developer-local Rust benchmarks with:

```sh
npm run bench:rust
```

To compare an incremental change against committed code, first save a baseline from the
committed revision:

```sh
cargo bench --features bench --bench distance_map -- --save-baseline committed
```

Then make the change and compare against it:

```sh
cargo bench --features bench --bench distance_map -- --baseline committed
```

The `bench` feature exposes internal Rust algorithm entry points for Criterion without changing the normal WASM API surface. The benchmark targets cover BFS, Dijkstra, A\* distance-map searches, flow-field generation, and path extraction against empty rooms and committed terrain fixtures.

Terrain fixtures are shared between the Rust and Node benchmarks. The private
server sector fixture lives at `benches/fixtures/terrain/private_server_sector.json`.
Single-room realistic scenarios pick rooms from that same sector fixture.

# Node WASM Benchmarks

Run the Node WASM benchmarks with:

```sh
npm run bench:wasm
```

These benchmarks build a separate `wasm-pack --target nodejs` package under
`benches/wasm/pkg` and exercise the generated wasm-bindgen exports from Node.
They cover the same distance-map, flow-field, and path-extraction groups as the
Rust Criterion benchmarks, plus boundary-focused cases that repeatedly read a
Rust-backed map and materialize a room into a JavaScript array.

Save a reusable baseline:

```sh
npm run bench:wasm:save
```

Compare the current working tree against that baseline:

```sh
npm run bench:wasm:compare
```

The saved Vitest benchmark JSON lives at `target/wasm-bench/main.json`.
