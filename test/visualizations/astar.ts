import { astarMultiroomDistanceMap, getTerrainCostMatrix as clockworkGetTerrainCostMatrix } from '../../src/index';

import { FlagVisualizer } from './helpers/FlagVisualizer';
import { visualizeDistanceMap } from './helpers/visualizeDistanceMap';
import { visualizePath } from './helpers/visualizePath';

function getTerrainCostMatrix(
  room: string,
  { plainCost, swampCost, wallCost }: { plainCost?: number; swampCost?: number; wallCost?: number } = {}
) {
  return clockworkGetTerrainCostMatrix(room, { plainCost, swampCost, wallCost });
}

export default [
  {
    name: 'A* Multiroom Distance Map',
    color1: COLOR_GREEN,
    color2: COLOR_RED,
    /**
     * Visualization of a distance map, where each cell tracks the distance to
     * the nearest flag.
     */
    run(rooms) {
      const [originFlag, ...targetFlags] = Object.values(rooms).reduce((acc, flags) => [...acc, ...flags], []);
      if (!originFlag || targetFlags.length === 0) {
        return;
      }
      const distanceMap = astarMultiroomDistanceMap([originFlag.pos], {
        costMatrixCallback: getTerrainCostMatrix,
        maxOps: 10000,
        allOfDestinations: targetFlags.map(flag => ({ pos: flag.pos, range: 0 }))
      }).distanceMap;
      for (const room of distanceMap.getRooms()) {
        visualizeDistanceMap(room, distanceMap.getRoom(room)!);
      }
    }
  },
  {
    name: 'A* Multiroom Distance Map Path',
    color1: COLOR_GREEN,
    color2: COLOR_GREEN,
    /**
     * Visualization of a Dijkstra multiroom distance map-based path.
     */
    run(rooms) {
      const [originFlag, targetFlag] = Object.values(rooms).reduce((acc, flags) => [...acc, ...flags], []);
      if (!originFlag || !targetFlag) {
        return;
      }

      const distanceMap = astarMultiroomDistanceMap([originFlag.pos], {
        costMatrixCallback: getTerrainCostMatrix,
        maxOps: 20000,
        anyOfDestinations: [{ pos: targetFlag.pos, range: 0 }]
      }).distanceMap;

      const path = distanceMap.pathToOrigin(targetFlag.pos);
      const pathArray = path.toArrayReversed();
      visualizePath(pathArray);
    }
  }
] satisfies FlagVisualizer[];
