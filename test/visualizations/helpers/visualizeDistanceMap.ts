import { DistanceMap } from '../../../src';

const UNREACHABLE = 0xffffffff;

/**
 * Visualize a distance map.
 * @param room - The room to visualize.
 * @param distanceMap - The distance map to visualize.
 */
export function visualizeDistanceMap(room: string, distanceMap: DistanceMap) {
  const distanceMapArray = distanceMap.toArray();

  const visual = Game.rooms[room].visual;
  distanceMapArray.forEach((distance, index) => {
    const y = index % 50;
    const x = Math.floor(index / 50);
    if (distance !== UNREACHABLE && distance !== 0) {
      visual.text(`${distance}`, x, y);
    }
  });
}
