# A\* and Other Optimizations

The [venerable A\* algorithm](https://www.redblobgames.com/pathfinding/a-star/introduction.html) provides the baseline for pathfinding in Screeps.

Red Blob Games has some [WIP articles on heuristics](https://www.redblobgames.com/blog/2024-05-05-wip-heuristics/).

- [Cooperative Pathfinding](https://theory.stanford.edu/~amitp/GameProgramming/MovingObstacles.html#predicting-obstacle-movement) (building a table of the paths of other units)
- JPS (generating paths, ignoring terrain costs)
- [Incremental heuristic search](https://en.wikipedia.org/wiki/Incremental_heuristic_search) (tracking moving targets)
- [Parallel Breadth-First Search](https://arxiv.org/abs/2210.16351)
