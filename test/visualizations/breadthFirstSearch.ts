import { bfsDistanceMap, bfsMultiroomDistanceMap, ClockworkCostMatrix, ephemeral } from '../../src/index';
import { FlagVisualizer } from './helpers/FlagVisualizer';
import { visualizeDistanceMap } from './helpers/visualizeDistanceMap';
import { visualizeFlowField } from './helpers/visualizeFlowField';
import { visualizeMonoFlowField } from './helpers/visualizeMonoFlowField';
import { visualizePath } from './helpers/visualizePath';

function getTerrainCostMatrix(room: string) {
  const costMatrix = new ClockworkCostMatrix();
  const terrain = Game.map.getRoomTerrain(room);
  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      costMatrix.set(x, y, terrain.get(x, y) === TERRAIN_MASK_WALL ? 255 : 0);
    }
  }
  return ephemeral(costMatrix);
}

export default [
  {
    name: 'BFS Distance Map',
    color1: COLOR_RED,
    color2: COLOR_RED,
    /**
     * Visualization of a distance map, where each cell tracks the distance to
     * the nearest flag.
     */
    run(rooms) {
      for (const room in rooms) {
        const flags = rooms[room];
        const costMatrix = getTerrainCostMatrix(room);
        const distanceMap = ephemeral(
          bfsDistanceMap(
            flags.map(flag => flag.pos),
            costMatrix
          )
        );
        visualizeDistanceMap(room, distanceMap);
      }
    }
  },
  {
    name: 'BFS Flow Field',
    color1: COLOR_RED,
    color2: COLOR_PURPLE,
    /**
     * Visualization of a flow field, where each cell may have zero to eight
     * viable directions.
     */
    run(rooms) {
      for (const room in rooms) {
        const flags = rooms[room];
        const costMatrix = getTerrainCostMatrix(room);
        const distanceMap = ephemeral(
          bfsDistanceMap(
            flags.map(flag => flag.pos),
            costMatrix
          )
        );
        const flowField = ephemeral(distanceMap.toFlowField());
        visualizeFlowField(room, flowField);
      }
    }
  },
  {
    name: 'BFS Mono Flow Field',
    color1: COLOR_RED,
    color2: COLOR_BLUE,
    /**
     * Visualization of a mono-directional flow field, where each cell has a
     * single direction.
     */
    run(rooms) {
      for (const room in rooms) {
        const flags = rooms[room];
        const costMatrix = getTerrainCostMatrix(room);
        const distanceMap = ephemeral(
          bfsDistanceMap(
            flags.map(flag => flag.pos),
            costMatrix
          )
        );
        const flowField = ephemeral(distanceMap.toMonoFlowField());
        visualizeMonoFlowField(room, flowField);
      }
    }
  },
  {
    name: 'BFS Flow Field Path',
    color1: COLOR_RED,
    color2: COLOR_CYAN,
    /**
     * Visualization of a BFS path.
     */
    run(rooms) {
      for (const room in rooms) {
        const [originFlag, ...targetFlags] = rooms[room];
        if (!originFlag || targetFlags.length === 0) {
          continue;
        }
        const costMatrix = getTerrainCostMatrix(room);
        const distanceMap = ephemeral(
          bfsDistanceMap(
            targetFlags.map(flag => flag.pos),
            costMatrix
          )
        );
        const flowField = ephemeral(distanceMap.toFlowField());
        const path = ephemeral(flowField.pathToOrigin(originFlag.pos));
        visualizePath(path);
      }
    }
  },
  {
    name: 'BFS Distance Map Path',
    color1: COLOR_RED,
    color2: COLOR_GREEN,
    /**
     * Visualization of a BFS distance map-based path.
     */
    run(rooms) {
      for (const room in rooms) {
        const [originFlag, ...targetFlags] = rooms[room];
        if (!originFlag || targetFlags.length === 0) {
          continue;
        }
        const costMatrix = getTerrainCostMatrix(room);
        const distanceMap = ephemeral(
          bfsDistanceMap(
            targetFlags.map(flag => flag.pos),
            costMatrix
          )
        );
        const path = ephemeral(distanceMap.pathToOrigin(originFlag.pos));
        visualizePath(path);
      }
    }
  },
  {
    name: 'BFS Mono Flow Field Path',
    color1: COLOR_RED,
    color2: COLOR_YELLOW,
    /**
     * Visualization of a BFS mono flow field-based path.
     */
    run(rooms) {
      for (const room in rooms) {
        const [originFlag, ...targetFlags] = rooms[room];
        if (!originFlag || targetFlags.length === 0) {
          continue;
        }
        const costMatrix = getTerrainCostMatrix(room);
        const distanceMap = ephemeral(
          bfsDistanceMap(
            targetFlags.map(flag => flag.pos),
            costMatrix
          )
        );
        const flowField = ephemeral(distanceMap.toMonoFlowField());
        const path = ephemeral(flowField.pathToOrigin(originFlag.pos));
        visualizePath(path);
      }
    }
  },
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
            maxRoomDistance: 2
          })
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
            maxRoomDistance: 2
          })
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
            maxRoomDistance: 2
          })
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
            maxRoomDistance: 2
          }
        )
      );
      const flowField = ephemeral(distanceMap.toFlowField());
      const path = ephemeral(flowField.pathToOrigin(originFlag.pos));
      visualizePath(path);
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
            maxRoomDistance: 2
          }
        )
      );
      const path = ephemeral(distanceMap.pathToOrigin(originFlag.pos));
      visualizePath(path);
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
            maxRoomDistance: 2
          }
        )
      );
      const flowField = ephemeral(distanceMap.toMonoFlowField());
      const path = ephemeral(flowField.pathToOrigin(originFlag.pos));
      visualizePath(path);
    }
  }
] satisfies FlagVisualizer[];
