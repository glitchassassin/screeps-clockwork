export function referenceGetTerrainCostMatrix(
  room: string,
  { plainCost = 1, swampCost = 5, wallCost = 255 }: { plainCost?: number; swampCost?: number; wallCost?: number }
) {
  const costMatrix = new PathFinder.CostMatrix();
  const terrain = Game.map.getRoomTerrain(room);
  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      switch (terrain.get(x, y)) {
        case TERRAIN_MASK_WALL:
          costMatrix.set(x, y, wallCost);
          break;
        case TERRAIN_MASK_SWAMP:
          costMatrix.set(x, y, swampCost);
          break;
        default:
          costMatrix.set(x, y, plainCost);
      }
    }
  }
  return costMatrix;
}
