# Primitives

Basic algorithms and patterns can be composed into an optimized pathfinding strategy for specific applications. For example, haulers might rely on a cached path to navigate out to a remote source to pick up some energy, and then rely on a cached flow field to navigate back to storage.

- Data Types
  - [Room Position](./roomposition.md)
  - [Room](./room.md)
  - [Cost matrix](./costmatrix.md)
  - [Flow field/distance map](./flowfield.md)
- Algorithms
  - [Distance](./distance.md)
  - [Breadth-first search](./breadth-first-search.md)
  - [Dijkstra's Algorithm](./dijkstras-algorithm.md)
  - [A\*](./astar.md)
- Systems
  - [Traffic](./traffic.md)
  - Movement (e.g. following a path)
    - It's useful to look up the next `n` steps in the path - e.g. for bucket brigade
    - Frequently useful to know the current distance from target
