import {
  getTerrainCostMatrix as clockworkGetTerrainCostMatrix,
  dijkstraMultiroomDistanceMap,
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
    name: 'Dijkstra Multiroom Distance Map',
    color1: COLOR_CYAN,
    color2: COLOR_RED,
    run(rooms) {
      for (const room in rooms) {
        const start = rooms[room].map(flag => flag.pos);
        const distanceMap = ephemeral(
          dijkstraMultiroomDistanceMap(start, {
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
    name: 'Dijkstra Multiroom Flow Field',
    color1: COLOR_CYAN,
    color2: COLOR_PURPLE,
    run(rooms) {
      for (const room in rooms) {
        const start = rooms[room].map(flag => flag.pos);
        const distanceMap = ephemeral(
          dijkstraMultiroomDistanceMap(start, {
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
    name: 'Dijkstra Multiroom Mono Flow Field',
    color1: COLOR_CYAN,
    color2: COLOR_BLUE,
    run(rooms) {
      for (const room in rooms) {
        const start = rooms[room].map(flag => flag.pos);
        const distanceMap = ephemeral(
          dijkstraMultiroomDistanceMap(start, {
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
    name: 'Dijkstra Multiroom Flow Field Path',
    color1: COLOR_CYAN,
    color2: COLOR_CYAN,
    /**
     * Visualization of a Dijkstra multiroom flow field-based path.
     */
    run(rooms) {
      const [originFlag, ...targetFlags] = Object.values(rooms).reduce((acc, flags) => [...acc, ...flags], []);
      if (!originFlag || targetFlags.length === 0) {
        return;
      }
      const distanceMap = ephemeral(
        dijkstraMultiroomDistanceMap(
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
    name: 'Dijkstra Multiroom Distance Map Path',
    color1: COLOR_CYAN,
    color2: COLOR_GREEN,
    /**
     * Visualization of a Dijkstra multiroom distance map-based path.
     */
    run(rooms) {
      const [originFlag, ...targetFlags] = Object.values(rooms).reduce((acc, flags) => [...acc, ...flags], []);
      if (!originFlag || targetFlags.length === 0) {
        return;
      }
      const distanceMap = ephemeral(
        dijkstraMultiroomDistanceMap(
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
    name: 'Dijkstra Multiroom Mono Flow Field Path',
    color1: COLOR_CYAN,
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
        dijkstraMultiroomDistanceMap(
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
