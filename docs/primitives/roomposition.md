# Room Positions

A position is uniquely addressed by its room name (e.g., `W5N5`) and x-y coordinates within the room (from 0-49, where 0,0 is the top left corner.)

Internally, Screeps [serializes the room position](https://github.com/screeps/engine/blob/97c9d12385fed686655c13b09f5f2457dd83a2bf/src/game/rooms.js#L1276-L1293) to a 32-bit integer called `__packedPos`.

Positions can theoretically be packed even more densely: it only takes 6 bits (0-63) to store each of the x-y coordinates, plus [7 or 8 bits](./room.md) (0-127 or 0-255 depending on the shard) for the x-y coordinates of the room itself, for a total of 26 bits.

## Coordinates

It's frequently useful to compare room positions in different rooms (for distance, e.g.) This algorithm combines the [room coordinates](./room.md#coordinates) with the position to get a global coordinate reference.

```ts
function roomPositionToCoords(pos: RoomPosition) {
  let { x, y, roomName } = pos;
  if (!_.inRange(x, 0, 50))
    throw new RangeError("x value " + x + " not in range");
  if (!_.inRange(y, 0, 50))
    throw new RangeError("y value " + y + " not in range");
  let { wx, wy } = roomNameToCoords(roomName);
  return {
    x: 50 * Number(wx) + x,
    y: 50 * Number(wy) + y,
  };
}
```
