import {
  astarMultiroomDistanceMap,
  getTerrainCostMatrix as clockworkGetTerrainCostMatrix,
  ephemeral
} from '../../src/index';
import { FlagVisualizer } from './helpers/FlagVisualizer';
import { visualizeDistanceMap } from './helpers/visualizeDistanceMap';
import { visualizePath } from './helpers/visualizePath';

function getTerrainCostMatrix(room: string) {
  return ephemeral(clockworkGetTerrainCostMatrix(room));
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
      const distanceMap = ephemeral(
        astarMultiroomDistanceMap([originFlag.pos], {
          costMatrixCallback: getTerrainCostMatrix,
          maxTiles: 10000,
          allOfDestinations: targetFlags.map(flag => flag.pos)
        })
      );
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
      const [originFlag, targetFlag, ...rest] = Object.values(rooms).reduce((acc, flags) => [...acc, ...flags], []);
      if (!originFlag || !targetFlag) {
        return;
      }

      const distanceMap = ephemeral(
        astarMultiroomDistanceMap([originFlag.pos], {
          costMatrixCallback: getTerrainCostMatrix,
          maxTiles: 10000,
          anyOfDestinations: [targetFlag.pos]
        })
      );

      const path = ephemeral(distanceMap.pathToOrigin(targetFlag.pos));
      const pathArray = path.toArray();
      visualizePath(pathArray);
    }
  }
] satisfies FlagVisualizer[];
