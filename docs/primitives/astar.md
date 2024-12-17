# A\* and Other Optimizations

The [venerable A\* algorithm](https://www.redblobgames.com/pathfinding/a-star/introduction.html) provides the baseline for pathfinding in Screeps.

Within a single room, the Clockwork implementation of the A\* algorithm alone is competitive with PathFinder. However, across longer distances (greater than a single room), PathFinder's JPS optimizations make a significant difference.

We'll experiment with a few different options.

## Optimizations

- [Jump-Point Search](https://zerowidth.com/2013/a-visual-explanation-of-jump-point-search/) is also used under the hood by PathFinder
- [Pre-computed landmarks](https://www.redblobgames.com/blog/2024-05-05-wip-heuristics/) for more accurate A\* heuristics

### Landmarks

The theory:

1. Pick a non-wall spot near the middle of the room and Dijkstra-map out from there.
2. Cache the center spot, one exit on each of the (1-4) sides, and cost for each.
3. Use these points as landmarks for the A\* heuristic.

Drawbacks:

Cost matrix used for calculating landmarks needs to be the same as cost matrix for pathing

## Other interesting variants

- [Cooperative Pathfinding](https://theory.stanford.edu/~amitp/GameProgramming/MovingObstacles.html#predicting-obstacle-movement) (building a table of the paths of other units)
- [Incremental heuristic search](https://en.wikipedia.org/wiki/Incremental_heuristic_search) (tracking moving targets)
- [Parallel Breadth-First Search](https://arxiv.org/abs/2210.16351)
