import { bfsDistanceMap, ClockworkCostMatrix } from 'screeps-clockwork';

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
    const costMatrix = getTerrainCostMatrix(room);
    const distanceMap = bfsDistanceMap(flagPositions, costMatrix);
    const distanceMapArray = distanceMap.toArray();
    distanceMap.free();

    const visual = Game.rooms[room].visual;
    distanceMapArray.forEach((distance, index) => {
      const x = index % 50;
      const y = Math.floor(index / 50);
      if (distance) {
        visual.text(`${distance}`, x, y);
      }
    });
  }
}
