## Using Paths

Paths can be used for:

- Moving a creep from point A to point B (and perhaps back again)
- Laying out road construction sites
- Measuring distance (with or without movement costs)

### Creep movement

A creep might be on the path; adjacent to the path (especially at the beginning); or nowhere near the path.

If the creep is _on_ the path, it might want to follow the path forwards or backwards (moving to or from a remote, perhaps).

If the creep is adjacent to the path, it might want to move onto the path, at the adjacent point closest to the destination (again, depending on whether it is following the path forwards or backwards).

### Laying out road construction sites

To plan roads, we really only care about the list of RoomPositions: we'd iterate over them, check if the road (or construction site) exists, and build it if necessary.

### Measuring distance (with or without movement costs)

If we are planning a road (to a remote, for example) our movement costs on the path might be static (1 point of [fatigue](./fatigue.md) per road, regardless of underlying terrain).

If we are planning a path _without_ roads, we might care about distance as actual travel time (calculating round-trip time to a deposit, for example). Of course, actual travel time depends on the creep's composition (MOVE parts reduce fatigue). We would have to track the fatigue cost of each tile to determine if a given creep composition moves at full speed or something slower.

There are four possible fatigue levels:

- 0 (room exits don't generate fatigue)
- 1 (roads)
- 2 (plains)
- 10 (swamps)

## Storing Paths

### List of RoomPositions

The simplest approach: the path is just a sequential series of RoomPositions.

To pick the next move tile, the creep can find its current position in the list and then move to the position at the next index. Or, if it's not in the list but is adjacent to one or more of the positions in the list, move to the adjacent position that's the furthest along. This can be optimized further by caching the creep's position on the path and using it as the starting point for future moves.

To plan roads, just iterate over the list as is.

To measure distance without terrain (for a path with roads, e.g.) just take the length of the list.

To measure move-distance with terrain, iterate over the list, getting the terrain cost at each position, and calculate the creep's speed for each tile. This can be optimized further by caching the terrain cost when the path is generated, and storing it alongside the position.

We probably don't want to store the fatigue _in_ the path, as it's likely to be updated separately (when roads are built/destroyed/become visible).

The data types might look like this:

```ts
type Path = Array<RoomPosition>;
type PathFatigue = Array<0 | 1 | 2 | 10>;
type PathCursor = {
  index: number;
  direction: 'forward' | 'backward';
};
```

If serialized together, there's [enough extra space](./roomposition.md) to combine both the position and fatigue in a single u32 number.

Since not all paths care about fatigue, we should have separate methods for calculating paths with fatigue (slightly more expensive) vs. without.

### Origin and List of Directions

A more efficient way to store a path is as an origin (RoomPosition) and list of directions from the origin. Each direction takes only 8 bits instead of ~32 bits for a RoomPosition. This can be "rehydrated" into a list of RoomPositions.

```ts
type CondensedPath = {
  origin: RoomPosition;
  directions: Array<Direction>;
};
```

If the creep knows its current position in the path, it can simply look up its index and move in the corresponding direction.

Measuring distance without terrain is functionally the same (taking the length of the list.)

Everything else really requires a list of RoomPositions (especially move-distance, since the [move cost depends on the square being moved to](./fatigue.md)).
