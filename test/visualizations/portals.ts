import {
  astarPortalMultiroomDistanceMap,
  bfsPortalMultiroomDistanceMap,
  dijkstraPortalMultiroomDistanceMap,
  getTerrainCostMatrix as clockworkGetTerrainCostMatrix
} from '../../src/index';
import { FlagVisualizer } from './helpers/FlagVisualizer';
import { visualizeDistanceMap } from './helpers/visualizeDistanceMap';
import { visualizeFlowField } from './helpers/visualizeFlowField';
import { visualizeMonoFlowField } from './helpers/visualizeMonoFlowField';
import { visualizePath } from './helpers/visualizePath';

type PortalDistanceMapSearch = (start: RoomPosition[]) => ReturnType<typeof bfsPortalMultiroomDistanceMap>;
type PortalPathSearch = (
  start: RoomPosition[],
  targetFlags: Flag[]
) => ReturnType<typeof bfsPortalMultiroomDistanceMap>;
type PortalPathKind = 'distanceMap' | 'flowField' | 'monoFlowField';

const PORTAL_PATH_STROKE = '#ff9800';
const MAX_PORTAL_VISUAL_OPS = 50000;
const MAX_PORTAL_VISUAL_ROOMS = 64;

function getTerrainCostMatrix(room: string) {
  return clockworkGetTerrainCostMatrix(room);
}

function orderedFlags(rooms: Record<string, Flag[]>): Flag[] {
  return Object.values(rooms)
    .reduce((acc, flags) => [...acc, ...flags], [] as Flag[])
    .sort((a, b) => a.name.localeCompare(b.name));
}

function visualizeOriginAndTarget(origin: RoomPosition, target: RoomPosition) {
  new RoomVisual(origin.roomName).text('O', origin.x, origin.y + 0.15, {
    color: '#00e676',
    font: 0.45,
    align: 'center'
  });
  new RoomVisual(target.roomName).text('T', target.x, target.y + 0.15, {
    color: '#ff5252',
    font: 0.45,
    align: 'center'
  });
}

function runPortalDistanceMap(rooms: Record<string, Flag[]>, search: PortalDistanceMapSearch) {
  for (const room in rooms) {
    const start = rooms[room].map(flag => flag.pos);
    if (start.length === 0) continue;

    const distanceMap = search(start).distanceMap;
    for (const room of distanceMap.getRooms()) {
      visualizeDistanceMap(room, distanceMap.getRoom(room)!);
    }
  }
}

function runPortalFlowField(
  rooms: Record<string, Flag[]>,
  search: PortalDistanceMapSearch,
  fieldKind: 'flowField' | 'monoFlowField'
) {
  for (const room in rooms) {
    const start = rooms[room].map(flag => flag.pos);
    if (start.length === 0) continue;

    const distanceMap = search(start).distanceMap;

    if (fieldKind === 'flowField') {
      const flowField = distanceMap.toFlowFieldWithPortals();
      for (const room of flowField.getRooms()) {
        visualizeFlowField(room, flowField.getRoom(room)!);
      }
      continue;
    }

    const flowField = distanceMap.toMonoFlowFieldWithPortals();
    for (const room of flowField.getRooms()) {
      visualizeMonoFlowField(room, flowField.getRoom(room)!);
    }
  }
}

function runPortalAstarDistanceMap(rooms: Record<string, Flag[]>) {
  const flags = orderedFlags(rooms);
  const [originFlag, ...targetFlags] = flags;
  if (!originFlag || targetFlags.length === 0) {
    return;
  }

  visualizeOriginAndTarget(originFlag.pos, targetFlags[0].pos);

  const distanceMap = astarPortalMultiroomDistanceMap([originFlag.pos], {
    costMatrixCallback: getTerrainCostMatrix,
    maxOps: MAX_PORTAL_VISUAL_OPS,
    maxRooms: MAX_PORTAL_VISUAL_ROOMS,
    allOfDestinations: targetFlags.map(flag => ({ pos: flag.pos, range: 0 }))
  }).distanceMap;

  for (const room of distanceMap.getRooms()) {
    visualizeDistanceMap(room, distanceMap.getRoom(room)!);
  }
}

function runPortalPath(rooms: Record<string, Flag[]>, search: PortalPathSearch, pathKind: PortalPathKind) {
  const flags = orderedFlags(rooms);
  const [originFlag, ...targetFlags] = flags;
  if (!originFlag || targetFlags.length === 0) {
    return;
  }

  visualizeOriginAndTarget(originFlag.pos, targetFlags[0].pos);

  const distanceMap = search([originFlag.pos], targetFlags).distanceMap;

  if (pathKind === 'flowField') {
    const flowField = distanceMap.toFlowFieldWithPortals();
    for (const room of flowField.getRooms()) {
      visualizeFlowField(room, flowField.getRoom(room)!);
    }
    visualizePath(flowField.pathToOriginWithPortals(originFlag.pos).toArray(), PORTAL_PATH_STROKE);
    return;
  }

  if (pathKind === 'monoFlowField') {
    const flowField = distanceMap.toMonoFlowFieldWithPortals();
    for (const room of flowField.getRooms()) {
      visualizeMonoFlowField(room, flowField.getRoom(room)!);
    }
    visualizePath(flowField.pathToOriginWithPortals(originFlag.pos).toArray(), PORTAL_PATH_STROKE);
    return;
  }

  visualizePath(distanceMap.pathToOriginWithPortals(originFlag.pos).toArray(), PORTAL_PATH_STROKE);
}

function runPortalAstarPath(rooms: Record<string, Flag[]>) {
  const flags = orderedFlags(rooms);
  const [originFlag, targetFlag] = flags;
  if (!originFlag || !targetFlag) {
    return;
  }

  visualizeOriginAndTarget(originFlag.pos, targetFlag.pos);

  const distanceMap = astarPortalMultiroomDistanceMap([originFlag.pos], {
    costMatrixCallback: getTerrainCostMatrix,
    maxOps: MAX_PORTAL_VISUAL_OPS,
    maxRooms: MAX_PORTAL_VISUAL_ROOMS,
    anyOfDestinations: [{ pos: targetFlag.pos, range: 0 }]
  }).distanceMap;

  visualizePath(distanceMap.pathToOriginWithPortals(targetFlag.pos).toArrayReversed(), PORTAL_PATH_STROKE);
}

function bfsPortalDistanceMap(start: RoomPosition[]) {
  return bfsPortalMultiroomDistanceMap(start, {
    costMatrixCallback: getTerrainCostMatrix,
    maxOps: MAX_PORTAL_VISUAL_OPS,
    maxRooms: MAX_PORTAL_VISUAL_ROOMS
  });
}

function dijkstraPortalDistanceMap(start: RoomPosition[]) {
  return dijkstraPortalMultiroomDistanceMap(start, {
    costMatrixCallback: getTerrainCostMatrix,
    maxOps: MAX_PORTAL_VISUAL_OPS,
    maxRooms: MAX_PORTAL_VISUAL_ROOMS
  });
}

function bfsPortalPathDistanceMap(_start: RoomPosition[], targetFlags: Flag[]) {
  return bfsPortalDistanceMap(targetFlags.map(flag => flag.pos));
}

function dijkstraPortalPathDistanceMap(_start: RoomPosition[], targetFlags: Flag[]) {
  return dijkstraPortalDistanceMap(targetFlags.map(flag => flag.pos));
}

export default [
  {
    name: 'Portal BFS Multiroom Distance Map',
    color1: COLOR_RED,
    color2: COLOR_RED,
    run(rooms) {
      runPortalDistanceMap(rooms, bfsPortalDistanceMap);
    }
  },
  {
    name: 'Portal BFS Multiroom Flow Field',
    color1: COLOR_RED,
    color2: COLOR_PURPLE,
    run(rooms) {
      runPortalFlowField(rooms, bfsPortalDistanceMap, 'flowField');
    }
  },
  {
    name: 'Portal BFS Multiroom Mono Flow Field',
    color1: COLOR_RED,
    color2: COLOR_BLUE,
    run(rooms) {
      runPortalFlowField(rooms, bfsPortalDistanceMap, 'monoFlowField');
    }
  },
  {
    name: 'Portal BFS Multiroom Flow Field Path',
    color1: COLOR_RED,
    color2: COLOR_CYAN,
    run(rooms) {
      runPortalPath(rooms, bfsPortalPathDistanceMap, 'flowField');
    }
  },
  {
    name: 'Portal BFS Multiroom Distance Map Path',
    color1: COLOR_RED,
    color2: COLOR_GREEN,
    run(rooms) {
      runPortalPath(rooms, bfsPortalPathDistanceMap, 'distanceMap');
    }
  },
  {
    name: 'Portal BFS Multiroom Mono Flow Field Path',
    color1: COLOR_RED,
    color2: COLOR_YELLOW,
    run(rooms) {
      runPortalPath(rooms, bfsPortalPathDistanceMap, 'monoFlowField');
    }
  },
  {
    name: 'Portal Dijkstra Multiroom Distance Map',
    color1: COLOR_ORANGE,
    color2: COLOR_RED,
    run(rooms) {
      runPortalDistanceMap(rooms, dijkstraPortalDistanceMap);
    }
  },
  {
    name: 'Portal Dijkstra Multiroom Flow Field',
    color1: COLOR_ORANGE,
    color2: COLOR_PURPLE,
    run(rooms) {
      runPortalFlowField(rooms, dijkstraPortalDistanceMap, 'flowField');
    }
  },
  {
    name: 'Portal Dijkstra Multiroom Mono Flow Field',
    color1: COLOR_ORANGE,
    color2: COLOR_BLUE,
    run(rooms) {
      runPortalFlowField(rooms, dijkstraPortalDistanceMap, 'monoFlowField');
    }
  },
  {
    name: 'Portal Dijkstra Multiroom Flow Field Path',
    color1: COLOR_ORANGE,
    color2: COLOR_CYAN,
    run(rooms) {
      runPortalPath(rooms, dijkstraPortalPathDistanceMap, 'flowField');
    }
  },
  {
    name: 'Portal Dijkstra Multiroom Distance Map Path',
    color1: COLOR_ORANGE,
    color2: COLOR_GREEN,
    run(rooms) {
      runPortalPath(rooms, dijkstraPortalPathDistanceMap, 'distanceMap');
    }
  },
  {
    name: 'Portal Dijkstra Multiroom Mono Flow Field Path',
    color1: COLOR_ORANGE,
    color2: COLOR_YELLOW,
    run(rooms) {
      runPortalPath(rooms, dijkstraPortalPathDistanceMap, 'monoFlowField');
    }
  },
  {
    name: 'Portal A* Multiroom Distance Map',
    color1: COLOR_BROWN,
    color2: COLOR_RED,
    run(rooms) {
      runPortalAstarDistanceMap(rooms);
    }
  },
  {
    name: 'Portal A* Multiroom Distance Map Path',
    color1: COLOR_BROWN,
    color2: COLOR_GREEN,
    run(rooms) {
      runPortalAstarPath(rooms);
    }
  }
] satisfies FlagVisualizer[];
