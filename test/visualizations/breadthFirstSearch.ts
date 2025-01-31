import {
  bfsMultiroomDistanceMap,
  getTerrainCostMatrix as clockworkGetTerrainCostMatrix,
  ephemeral
} from '../../src/index';
import { FlagVisualizer } from './helpers/FlagVisualizer';
import { visualizeDistanceMap } from './helpers/visualizeDistanceMap';
import { visualizeFlowField } from './helpers/visualizeFlowField';
import { visualizeMonoFlowField } from './helpers/visualizeMonoFlowField';
import { visualizePath } from './helpers/visualizePath';

function getTerrainCostMatrix(room: string) {
  return ephemeral(clockworkGetTerrainCostMatrix(room));
}

export default [
  {
    name: 'BFS Multiroom Distance Map',
    color1: COLOR_PURPLE,
    color2: COLOR_RED,
    run(rooms) {
      for (const room in rooms) {
        const start = rooms[room].map(flag => flag.pos);
        const distanceMap = ephemeral(
          bfsMultiroomDistanceMap(start, {
            costMatrixCallback: getTerrainCostMatrix,
            maxOps: 10000
          }).distanceMap
        );
        for (const room of distanceMap.getRooms()) {
          visualizeDistanceMap(room, distanceMap.getRoom(room)!);
        }
      }
    }
  },
  {
    name: 'BFS Multiroom Flow Field',
    color1: COLOR_PURPLE,
    color2: COLOR_PURPLE,
    run(rooms) {
      for (const room in rooms) {
        const start = rooms[room].map(flag => flag.pos);
        const distanceMap = ephemeral(
          bfsMultiroomDistanceMap(start, {
            costMatrixCallback: getTerrainCostMatrix,
            maxOps: 10000
          }).distanceMap
        );
        const flowField = ephemeral(distanceMap.toFlowField());
        for (const room of flowField.getRooms()) {
          visualizeFlowField(room, flowField.getRoom(room)!);
        }
      }
    }
  },
  {
    name: 'BFS Multiroom Mono Flow Field',
    color1: COLOR_PURPLE,
    color2: COLOR_BLUE,
    run(rooms) {
      for (const room in rooms) {
        const start = rooms[room].map(flag => flag.pos);
        const distanceMap = ephemeral(
          bfsMultiroomDistanceMap(start, {
            costMatrixCallback: getTerrainCostMatrix,
            maxOps: 10000
          }).distanceMap
        );
        const flowField = ephemeral(distanceMap.toMonoFlowField());
        for (const room of flowField.getRooms()) {
          visualizeMonoFlowField(room, flowField.getRoom(room)!);
        }
      }
    }
  },
  {
    name: 'BFS Multiroom Flow Field Path',
    color1: COLOR_PURPLE,
    color2: COLOR_CYAN,
    /**
     * Visualization of a BFS multiroom flow field-based path.
     */
    run(rooms) {
      const [originFlag, ...targetFlags] = Object.values(rooms).reduce((acc, flags) => [...acc, ...flags], []);
      if (!originFlag || targetFlags.length === 0) {
        return;
      }
      const distanceMap = ephemeral(
        bfsMultiroomDistanceMap(
          targetFlags.map(flag => flag.pos),
          {
            costMatrixCallback: getTerrainCostMatrix,
            maxOps: 10000
          }
        ).distanceMap
      );
      const flowField = ephemeral(distanceMap.toFlowField());
      const path = ephemeral(flowField.pathToOrigin(originFlag.pos));
      visualizePath(path.toArray());
    }
  },
  {
    name: 'BFS Multiroom Distance Map Path',
    color1: COLOR_PURPLE,
    color2: COLOR_GREEN,
    /**
     * Visualization of a BFS multiroom distance map-based path.
     */
    run(rooms) {
      const [originFlag, ...targetFlags] = Object.values(rooms).reduce((acc, flags) => [...acc, ...flags], []);
      if (!originFlag || targetFlags.length === 0) {
        return;
      }
      const distanceMap = ephemeral(
        bfsMultiroomDistanceMap(
          targetFlags.map(flag => flag.pos),
          {
            costMatrixCallback: getTerrainCostMatrix,
            maxOps: 10000
          }
        ).distanceMap
      );
      const path = ephemeral(distanceMap.pathToOrigin(originFlag.pos));
      visualizePath(path.toArray());
    }
  },
  {
    name: 'BFS Multiroom Mono Flow Field Path',
    color1: COLOR_PURPLE,
    color2: COLOR_YELLOW,
    /**
     * Visualization of a BFS mono flow field-based path.
     */
    run(rooms) {
      const [originFlag, ...targetFlags] = Object.values(rooms).reduce((acc, flags) => [...acc, ...flags], []);
      if (!originFlag || targetFlags.length === 0) {
        return;
      }
      const distanceMap = ephemeral(
        bfsMultiroomDistanceMap(
          targetFlags.map(flag => flag.pos),
          {
            costMatrixCallback: getTerrainCostMatrix,
            maxOps: 10000
          }
        ).distanceMap
      );
      const flowField = ephemeral(distanceMap.toMonoFlowField());
      const path = ephemeral(flowField.pathToOrigin(originFlag.pos));
      visualizePath(path.toArray());
    }
  }
] satisfies FlagVisualizer[];
