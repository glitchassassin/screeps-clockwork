# Calculating Distance

## Room Distance

Rooms can only be traversed in four directions (north, south, east, or west), so we calculate the [Manhattan distance](https://en.wikipedia.org/wiki/Taxicab_geometry) between rooms:

```ts
function manhattanDistance(room1: string, room2: string) {
  const { x: x1, y: y1 } = roomNameToCoords(room1);
  const { x: x2, y: y2 } = roomNameToCoords(room2);

  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}
```

## Tile Distance

Tiles can be traversed in eight directions (including diagonals), so we calculate the [Chebyshev distance](https://en.wikipedia.org/wiki/Chebyshev_distance) between tiles:

```ts
function chebyshevDistance(pos1: RoomPosition, pos2: RoomPosition) {
  const { x: x1, y: y1 } = roomPositionToCoords(pos1);
  const { x: x2, y: y2 } = roomPositionToCoords(pos2);

  return Math.max(Math.abs(x1 - x2) + Math.abs(y1 - y2));
}
```
