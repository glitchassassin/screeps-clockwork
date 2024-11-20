# WASM Implementation

We are using wasm-bindgen to create the WASM and a JS shim (`packages/wasm`). There are a few things we tweak to improve performance (such as passing in the `__packedPos` instead of the whole RoomPosition), so this is further wrapped in a Typescript library (`packages/screeps-clockwork`) which wraps and re-exports the WASM functionality.
