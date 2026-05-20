## Portals in Screeps

Strictly speaking, a PortalStructure is unidirectional. It's a walkable structure that has a `destination` and acts like a room exit tile (except it does not have the same special zero-fatigue case). Portals may connect tiles on the same shard ("intrashard portals") or on different shards ("intershard portals").

Although there's no rule in the engine to enforce this, intrashard portals always have a corresponding portal at the destination that links back, making them effectively bidirectional.

This is true for many, but not all, intershard portals as well. For pathfinding purposes, we will ignore intershard portals - there's no way to fetch terrain for another shard, so intershard paths must be handled at a higher level.

## Pathing with Portals

Portals are fairly straightforward to integrate with BFS or Dijkstra algorithms. Just add the portal exit as another neighbor, and the algorithm will happily explore away. However, they immediately break the default A* heuristic.

The default heuristic approximates the shortest possible distance to the target based on linear distance. With portals, the linear distance might not be the shortest distance. That means that the default heuristic is no longer "admissible." Even if we explore through portals as part of pathfinding, the default heuristic can lead us astray and cause us to wind up with a longer path. 

## Portal-Compatible Heuristics

Depending on how many portals you have in the portal network, you could create a more accurate heuristic by pre-calculating a portal graph. Tracking distances between portals and from the portals to the target could get you closer; however, this becomes very computationally intensive when we have as many portals as Screeps supports. In shard0, for example, there are highway rooms where one or two walls are completely lined with portals (close to 100).

The cheapest heuristic that I've found, therefore, is to ignore the portal connections themselves and calculate a lower bound based on the closest portal.

```ts
function heuristic(tile: RoomPosition, target: RoomPosition) {
    return Math.min(
        distance(tile, target),
        distance(tile, closestPortalEntrance(tile)) + distance(target, closestPortalExit(target))
    )
}
```

The closest portal to the tile and the closest portal to the target aren't necessarily connected. But they could be. If they are, that represents the shortest portal path - which is all that's necessary for an admissible heuristic.

If there are a lot of portals, this can still become expensive. We can speed up the `closestPortal` lookup with caching or other optimizations.