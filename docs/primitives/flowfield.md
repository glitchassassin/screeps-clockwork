# Distance Fields and Flow Fields

[Applying Dijkstra's Algorithm](https://theory.stanford.edu/~amitp/GameProgramming/Variations.html#flow-fields) to a room can create not only a path, but also a "distance field" (or Dijkstra map) and a "flow field". This is useful for frequently visited targets (like storage).

Distance/flow fields have terrain costs baked in, so you need a separate flow field if you want a version for empty haulers vs. full ones (where empty haulers can ignore terrain costs).

## Storage Considerations

A distance field that takes into account terrain costs (1 for plains, 5 for swamps) can _mostly_ fit into a cost matrix of 8-bit unsigned integers for a normal room. The worst-case scenario is a kind of zig-zag maze such that there's only one path from one end of the room to the other, which takes a little less than 50 \* 25 = 1250 tiles. With terrain costs, the max value would be around 6,250. With custom costs, it could be significantly higher.

A flow field is more compact: it always needs only three bits per tile, to represent one of eight possible directions. This is in theory all that's needed for movement, but it makes calculating distance a little more expensive.

A flow field can also store multiple directions per tile, if equally viable, for smoother traffic management. This means a cap of 3x8 = 24 bits, but could be compressible.

## Usage

### Pathing to the target from anywhere in the room

With a flow field, simply look up the direction for the current x/y position, and move in that direction.

With a distance field, check the adjacent positions for the lowest value, and move to one of those. (Note that this can give multiple movement options, useful for traffic management.)

We could track a modified flow field that includes multiple equally viable moves: this would take 3x8 = 24 bits per tile (likely compressible).

### Pathing from the target to anywhere in the room

More expensive, but less so than pathfinding: start with the desired destination, and trace a path back to the source of the flowfield. Then, simply reverse those directions.

Allowing multiple optimal paths for traffic management still works here, but probably wants a map of positions to directions.

### Calculating distances

Follow the path as described above, getting terrain cost for each tile and summing the total. Direction doesn't matter.

## Considerations

Distance/flow fields are more expensive to generate than an a\* path, as they cover the whole room, not just the relevant part between two points.

A single flowfield can replace multiple a\* paths.

Storing a distance field is more expensive than a flow field, and slightly more time-consuming for navigation purposes.

A distance field gives cheaper distance estimates than a flow field.

## Ideas

What if we do an A\* flow field, giving us the best of both worlds: a cheaper route, and multiple options for traffic control? Could go further and pare down to just the relevant squares from the source.

This would be less relevant if the creep needs to move on roads, but potentially very useful in certain situations.

In some situations (e.g. blob pathfinding), we might only care about a flowfield out to specific targets (from leader to blob followers).
