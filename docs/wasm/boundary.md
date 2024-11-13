# The WASM Boundary

WASM promises faster code execution than Javascript, but it has a weakness: moving data between WASM-land and Javascript-land is not free. Every time we generate a path, flow field, etc., we incur that boundary cost.

Except... what if we don't need to?

Maybe we're generating a flow field, cached in heap, but we don't really need the field itself on the Javascript side; we're just going to pass it back into WASM to generate paths later.

Instead, we can pass a pointer (not an actual memory pointer - we don't trust the client - but an integer that looks up the cached value).

But, first, we need a sense of scale. I ran some tests to find the relative CPU usage for these data types:

**CPU usage per 1,000 iterations**

| Length:     | 1         | 100       | 10,000   |
| ----------- | --------- | --------- | -------- |
| **Integer** | ~0.03 CPU | -         | -        |
| **Array**   | ~1 CPU    | ~1 CPU    | ~23 CPU  |
| **String**  | ~0.5 CPU  | ~1.75 CPU | ~110 CPU |

For reference, a typical cost matrix is an array of 2,500 items (50x50).
