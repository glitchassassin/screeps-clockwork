# Breadth-First Search

There's a great explanation of [breadth-first search (BFS) at Red Blob Games](https://www.redblobgames.com/pathfinding/a-star/introduction.html#breadth-first-search).

BFS is useful for generating distance maps and flow fields, but it doesn't account for terrain cost, so its applications are limited in Screeps.

Still, you might have scenarios where you don't care about terrain cost (e.g. pathing for empty haulers). In those cases, BFS is a little more efficient than Dijkstra's algorithm.
