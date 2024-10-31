# Rooms

Rooms in Screeps are named by quadrant: east/west and north/south. The four center rooms (on a typical MMO map) are E0N0, W0N0, E0S0, and W0S0. Private server maps may only have a single quadrant.

There is no hard limit on map size, but in practice, the largest MMO shard (shard0) goes from W90N90 to E90S90, a total map size of 182x182. The other MMO shards go from W60N60 to E60N60, a total map size of 122x122.

This means that rooms in shard0 can be serialized into an 8-bit unsigned integer (0-255), and other shards can be serialized into a 7-bit unsigned integer (0-127).

## Coordinates

Converting a room name to coordinates is frequently useful. This algorithm uses E0S0 as (0, 0) and uses a bitwise NOT `~` to convert the x/y coords to negative for the W and N quadrants (so numbers get larger as you move down and to the right).

```ts
export const roomNameToCoords = (roomName: string) => {
  if (roomName === "sim") return { wx: 0, wy: 0 };
  let match = roomName.match(/^([WE])([0-9]+)([NS])([0-9]+)$/);
  if (!match) throw new Error("Invalid room name");
  let [, h, wx, v, wy] = match;
  return {
    wx: h == "W" ? ~Number(wx) : Number(wx),
    wy: v == "N" ? ~Number(wy) : Number(wy),
  };
};
export const roomNameFromCoords = (x: number, y: number) => {
  let h = x < 0 ? "W" : "E";
  let v = y < 0 ? "N" : "S";
  x = x < 0 ? ~x : x;
  y = y < 0 ? ~y : y;
  return `${h}${x}${v}${y}`;
};
```
