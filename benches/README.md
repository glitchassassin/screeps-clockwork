# Rust Benchmarks

Run the developer-local Rust benchmarks with:

```sh
cargo bench --features bench --bench distance_map
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

The `bench` feature exposes internal Rust algorithm entry points for Criterion without changing the normal WASM API surface. The benchmark targets cover BFS, Dijkstra, A* distance-map searches, flow-field generation, and path extraction against empty rooms and committed terrain fixtures extracted from `~/repos/autoscreeps`.
