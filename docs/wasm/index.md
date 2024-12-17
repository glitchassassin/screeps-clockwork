# WASM Implementation

We are using wasm-bindgen to create the WASM and a JS shim (`packages/wasm`). There are a few things we tweak to improve performance (such as passing in the `__packedPos` instead of the whole RoomPosition), so this is further wrapped in a Typescript library (`packages/screeps-clockwork`) which wraps and re-exports the WASM functionality.

- Copying data across the [WASM boundary](./boundary.md) adds up, so we must be thoughtful about when and how we copy data back and forth.
- Javascript can't garbage-collect our Rust objects, so we need to [clean them up explicitly](./cleanup.md).
