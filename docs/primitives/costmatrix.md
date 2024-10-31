# Cost Matrix

A cost matrix is a way of representing the cost of each individual tile in a room for a pathfinding algorithm like A\* or Dijkstra's.

Internally, it's simply a list of 2500 unsigned integers (one for each tile). The built-in Pathfinder uses a 8-bit integers (0-255).
