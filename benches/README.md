# Rust Benchmarks

Run the developer-local Rust benchmarks with:

```sh
cargo bench --features bench --bench distance_map
```

The `bench` feature exposes internal Rust algorithm entry points for Criterion without changing the normal WASM API surface. The first benchmark target compares Dijkstra and A* distance-map searches against empty rooms and committed terrain fixtures extracted from `~/repos/autoscreeps`.
