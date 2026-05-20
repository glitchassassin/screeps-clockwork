## 0.13.0 (2026-05-20)

### Feat

- add portal cache and portal-aware algorithms (#264)

## 0.12.0 (2026-05-19)

### Feat

- add rust/node benchmarks and optimizations (#257)

### Fix

- properly reverse arrays on visualizations
- only allow legal directions on edge tiles

## 0.11.0 (2026-05-16)

### Feat

- add public type exports for distance maps

## 0.10.0 (2026-05-16)

### Fix

- correct semantics for pathToOrigin
- update reset-docker user setup for new client

## 0.9.1 (2026-05-15)

### Fix

- stop distance map paths at edge origins

## 0.9.0 (2026-05-15)

### BREAKING CHANGE

- remove the Clockwork ephemeral/persist cleanup helpers and wrapper-level free methods. Rust-backed objects now follow JavaScript reachability and wasm-bindgen finalization; advanced callers can still use free on raw wasm-bindgen exports like ClockworkCostMatrix.

### Feat

- rely on wasm finalizers for cleanup

## 0.8.0 (2026-05-15)

### Feat

- add configurable preference for diagonal paths

### Fix

- stabilize node24 benchmarks, upgrade screeps-game-api, fix ownership bug
- update for latest screeps version/node 24

## 0.7.2 (2026-05-14)

### Fix

- convert packedPos to signed int32 for correct JS-land comparisons

## 0.7.1 (2025-01-31)

### Fix

- type mismatch

## 0.7.0 (2025-01-31)

### Feat

- specify targets with ranges

## 0.6.0 (2025-01-16)

### Feat

- use RoomDataCache with other algorithms
- allow anyOf, allOf destinations for A\*
- implement room data cache from PF for more efficiency
- optimize A\* datastructures
- astar algorithm
- cost matrix cache struct
- optimization
- calculate terrain matrix in Rust
- add early exit based on destinations
- add ephemeral and persist helpers

### Fix

- include destination + both edge tiles in paths

### Refactor

- clean up unused code
- standardize maxOps, maxPathCost
- clean up A\* implementation
- split out heuristics function for experimentation
- condense duplicated flow field logic

## 0.5.0 (2024-12-11)

### Feat

- add dijkstra generators
- implement multi-room flow fields
- implement multi-room distance map paths
- implement multi-room distance maps

## 0.4.0 (2024-12-05)

### Feat

- implement path-from-mono-flow-field
- implement path-from-distance-map
- add legend of visualizer options
- implement path-from-flow-field algorithm

### Fix

- account for edge tile movement restrictions

## 0.3.0 (2024-12-04)

### Feat

- implement path data types

### Fix

- **algorithms**: remove illegal moves from distance map/flow field

## 0.2.1 (2024-11-25)

### Fix

- bundle wasm-generated types

## 0.2.0 (2024-11-25)

### Feat

- add dijkstra distance map, flow fields

### Refactor

- splitting up bfs mod
