import { bfsDistanceMap } from 'screeps-clockwork';

function getTerrainCostMatrix(room: string) {
  const costMatrix = new PathFinder.CostMatrix();
  const terrain = Game.map.getRoomTerrain(room);
  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      costMatrix.set(x, y, terrain.get(x, y) === TERRAIN_MASK_WALL ? 255 : 0);
    }
  }
  return costMatrix;
}

export function visualizeBfsDistanceMap() {
  for (const flag of Object.values(Game.flags)) {
    if (flag.color === COLOR_BLUE && flag.secondaryColor === COLOR_BLUE) {
      const costMatrix = getTerrainCostMatrix(flag.pos.roomName);
      const distanceMap = bfsDistanceMap([flag.pos], costMatrix);
      const distanceMapArray = distanceMap.toArray();
      distanceMap.free();

      const visual = Game.rooms[flag.pos.roomName].visual;
      distanceMapArray.forEach((distance, index) => {
        const x = index % 50;
        const y = Math.floor(index / 50);
        if (distance) {
          visual.text(`${distance}`, x, y);
        }
      });
    }
  }
}
