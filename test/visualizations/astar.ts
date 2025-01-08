import {
  astarMultiroomDistanceMap,
  getTerrainCostMatrix as clockworkGetTerrainCostMatrix,
  ephemeral,
  jpsPath
} from '../../src/index';
import { FlagVisualizer } from './helpers/FlagVisualizer';
import { visualizeDistanceMap } from './helpers/visualizeDistanceMap';
import { visualizePath } from './helpers/visualizePath';

function getTerrainCostMatrix(room: string) {
  return ephemeral(clockworkGetTerrainCostMatrix(room));
}

let avg_pf_cpu = 0;
let avg_rust_pf_cpu = 0;

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
        astarMultiroomDistanceMap(
          [originFlag.pos],
          targetFlags.map(flag => flag.pos),
          {
            costMatrixCallback: getTerrainCostMatrix,
            maxTiles: 10000
          }
        )
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
        astarMultiroomDistanceMap([originFlag.pos], [targetFlag.pos], {
          costMatrixCallback: getTerrainCostMatrix,
          maxTiles: 10000
        })
      );

      const path = ephemeral(distanceMap.pathToOrigin(targetFlag.pos));
      const pathArray = path.toArray();
      visualizePath(pathArray);
    }
  },
  {
    name: 'JPS Path',
    color1: COLOR_YELLOW,
    color2: COLOR_GREEN,
    /**
     * Visualization of a JPS path.
     */
    run(rooms) {
      const [originFlag, targetFlag, ...rest] = Object.values(rooms).reduce((acc, flags) => [...acc, ...flags], []);
      if (!originFlag || !targetFlag) {
        return;
      }

      let start_cpu = Game.cpu.getUsed();
      let pathFinderPath: PathFinderPath;
      const visitedRooms = new Set<string>();
      pathFinderPath = PathFinder.search(
        targetFlag.pos,
        { pos: originFlag.pos, range: 0 },
        {
          maxCost: 1500,
          maxOps: 50000,
          maxRooms: 100,
          roomCallback: roomName => {
            visitedRooms.add(roomName);
            return new PathFinder.CostMatrix();
          },
          heuristicWeight: 1
        }
      );
      let end_cpu = Game.cpu.getUsed();
      let pf_cpu = end_cpu - start_cpu;
      let weight = 0.1;
      avg_pf_cpu = avg_pf_cpu * (1 - weight) + pf_cpu * weight;

      visualizePath(pathFinderPath!.path, 'red');
      start_cpu = Game.cpu.getUsed();
      const path = jpsPath(originFlag.pos, [targetFlag.pos]);
      end_cpu = Game.cpu.getUsed();
      let rust_pf_cpu = end_cpu - start_cpu;
      avg_rust_pf_cpu = avg_rust_pf_cpu * (1 - weight) + rust_pf_cpu * weight;
      console.log(`Clockwork CPU: ${rust_pf_cpu}, Avg Clockwork CPU: ${avg_rust_pf_cpu}`);
      console.log(
        `PathFinder CPU: ${pf_cpu}, \nAvg PathFinder CPU: ${avg_pf_cpu}, \nPathFinder Ops: ${pathFinderPath.ops}, \nlength: ${pathFinderPath.path.length}, \nCost: ${pathFinderPath.cost}, \nVisited Rooms: ${visitedRooms.size}, \nIncomplete: ${pathFinderPath.incomplete}`
      );
      visualizePath(path, 'green');
    }
  }
] satisfies FlagVisualizer[];
