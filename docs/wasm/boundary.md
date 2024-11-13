# The WASM Boundary

WASM promises faster code execution than Javascript, but it has a weakness: moving data between WASM-land and Javascript-land is not free. Every time we generate a path, flow field, etc., we incur that boundary cost.

I ran some tests to find the relative CPU usage for passing these data types across the WASM boundary:

**CPU usage per 1,000 iterations**

| Length:     | 1         | 100       | 10,000   |
| ----------- | --------- | --------- | -------- |
| **Integer** | ~0.03 CPU | -         | -        |
| **Array**   | ~1 CPU    | ~1 CPU    | ~23 CPU  |
| **String**  | ~0.5 CPU  | ~1.75 CPU | ~110 CPU |

For reference, a typical cost matrix is an array of 2,500 items (50x50).

Sometimes, we don't need to pass _all_ the data back and forth: we can [return a Rust struct](https://rustwasm.github.io/wasm-bindgen/reference/types/exported-rust-types.html), and wasm-bindgen will generate a class that tracks the reference for us. This will be ideal for most scenarios. However, users may need to clean up these objects manually.
