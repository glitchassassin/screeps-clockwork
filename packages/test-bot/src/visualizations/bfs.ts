import { bfsDistanceMap, bfsFlowField, ClockworkCostMatrix } from 'screeps-clockwork';

const UNREACHABLE = 0xffffffff;

function getTerrainCostMatrix(room: string) {
  const costMatrix = new ClockworkCostMatrix();
  const terrain = Game.map.getRoomTerrain(room);
  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      costMatrix.set(x, y, terrain.get(x, y) === TERRAIN_MASK_WALL ? 255 : 0);
    }
  }
  return costMatrix;
}

export function visualizeBfsDistanceMap() {
  const rooms = Object.values(Game.flags).reduce((acc, flag) => {
    if (flag.color === COLOR_BLUE && flag.secondaryColor === COLOR_BLUE) {
      acc[flag.pos.roomName] ??= [];
      acc[flag.pos.roomName].push(flag.pos);
    }
    return acc;
  }, {} as Record<string, RoomPosition[]>);
  for (const room in rooms) {
    const flagPositions = rooms[room];
    console.log(flagPositions);
    const costMatrix = getTerrainCostMatrix(room);
    const distanceMap = bfsDistanceMap(flagPositions, costMatrix);
    const distanceMapArray = distanceMap.toArray();
    distanceMap.free();

    const visual = Game.rooms[room].visual;
    distanceMapArray.forEach((distance, index) => {
      const y = index % 50;
      const x = Math.floor(index / 50);
      if (distance !== UNREACHABLE) {
        console.log(x, y, distance);
        visual.text(`${distance}`, x, y);
      }
    });
  }
}

const DIRECTION_OFFSET = {
  [TOP]: { x: 0, y: 0.5 },
  [TOP_RIGHT]: { x: -0.5, y: 0.5 },
  [RIGHT]: { x: -0.5, y: 0 },
  [BOTTOM_RIGHT]: { x: -0.5, y: -0.5 },
  [BOTTOM]: { x: 0, y: -0.5 },
  [BOTTOM_LEFT]: { x: 0.5, y: -0.5 },
  [LEFT]: { x: 0.5, y: 0 },
  [TOP_LEFT]: { x: 0.5, y: 0.5 }
};

export function visualizeBfsFlowField() {
  const rooms = Object.values(Game.flags).reduce((acc, flag) => {
    if (flag.color === COLOR_BLUE && flag.secondaryColor === COLOR_CYAN) {
      acc[flag.pos.roomName] ??= [];
      acc[flag.pos.roomName].push(flag.pos);
    }
    return acc;
  }, {} as Record<string, RoomPosition[]>);
  for (const room in rooms) {
    const flagPositions = rooms[room];
    const costMatrix = getTerrainCostMatrix(room);
    const flowField = bfsFlowField(flagPositions, costMatrix);

    const visual = Game.rooms[room].visual;
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const directions = flowField.getDirections(x, y) as DirectionConstant[];
        for (const direction of directions) {
          const offset = DIRECTION_OFFSET[direction];
          visual.line(x, y, x + offset.x, y + offset.y);
        }
      }
    }
    flowField.free();
  }
}
