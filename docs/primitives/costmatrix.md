# Cost Matrix

A cost matrix is a way of representing the cost of each individual tile in a room for a pathfinding algorithm like A\* or Dijkstra's.

Internally, it's simply a list of 2500 unsigned integers (one for each tile). The built-in Pathfinder uses a 8-bit integers (0-255).

## Implementation Details

Clockwork uses the [`LocalCostMatrix` from screeps-game-api](https://github.com/rustyscreeps/screeps-game-api/) internally, but exposes a `ClockworkCostMatrix` class with `get` and `set` methods similar to `PathFinder.CostMatrix`. These have approximately the same cost as the PathFinder version. Rust-backed allocations are released by JavaScript finalizers once the wrapper object is no longer reachable.
