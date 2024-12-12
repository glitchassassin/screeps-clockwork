const UNREACHABLE = 0xffffffff;

/**
 * Visualize a distance map.
 * @param room - The room to visualize.
 * @param distanceMap - The distance map to visualize.
 */
export function visualizeDistanceMap(
  room: string,
  distanceMap: {
    toArray: () => number[] | Uint32Array;
  }
) {
  const distanceMapArray = distanceMap.toArray();

  const viz = new RoomVisual(room);
  distanceMapArray.forEach((distance, index) => {
    const y = index % 50;
    const x = Math.floor(index / 50);
    if (distance !== UNREACHABLE && distance !== 0) {
      viz.text(`${distance}`, x, y);
    }
  });
}
