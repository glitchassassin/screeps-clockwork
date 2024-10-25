# Distance Fields and Flow Fields

[Applying Dijkstra's Algorithm](https://theory.stanford.edu/~amitp/GameProgramming/Variations.html#flow-fields) to a room can create not only a path, but also a "distance field" (or Dijkstra map) and a "flow field". This is useful for frequently visited targets (like storage).

## Storage Considerations

A distance field that takes into account terrain costs (1 for plains, 5 for swamps) can *probably* fit into a cost matrix of 8-bit unsigned integers. (There are some edge cases - for example, a position at the center of a spiral maze can easily scale a distance field beyond 255. Ignoring terrain costs saves some space, but still has a theoretical cap.)

A flow field is more compact: it always needs only three bits per tile, to represent one of eight possible directions. This is all that's needed for movement, but it makes calculating distance a little more expensive.

## Usage

### Pathing to the target from anywhere in the room

With a flow field, simply look up the direction for the current x/y position, and move in that direction.

With a distance field, check the adjacent positions for the lowest value, and move to one of those. (Note that this can give multiple movement options, useful for traffic management.)

- Pathing from the target to anywhere in the room: 
