## 0.7.1 (2025-01-31)

### Fix

- type mismatch

## 0.7.0 (2025-01-31)

### Feat

- specify targets with ranges

## 0.6.0 (2025-01-16)

### Feat

- use RoomDataCache with other algorithms
- allow anyOf, allOf destinations for A*
- implement room data cache from PF for more efficiency
- optimize A* datastructures
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
- clean up A* implementation
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
