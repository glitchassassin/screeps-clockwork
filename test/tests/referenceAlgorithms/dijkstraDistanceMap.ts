export class ReferenceDistanceMap {
  internal: number[] = new Array(50 * 50).fill(Infinity);

  get(x: number, y: number) {
    return this.internal[x * 50 + y];
  }

  set(x: number, y: number, value: number) {
    this.internal[x * 50 + y] = value;
  }
}

export type Coord = {
  x: number;
  y: number;
};

type State = {
  cost: number;
  position: Coord;
};

function isEdge(pos: Coord) {
  return pos.x === 0 || pos.x === 49 || pos.y === 0 || pos.y === 49;
}

/**
 * Creates a distance map for the given start positions, using a breadth-first search.
 * This does not factor in terrain costs (treating anything less than 255 in the cost
 * matrix as passable), so it's faster but less useful than Dijkstra's algorithm.
 *
 * @param startPositions Array of RoomPositions where the search should start from
 * @param costMatrix Cost matrix representing the terrain/obstacles
 * @returns A distance map where keys are packed positions and values are distances
 */
export function referenceDijkstraDistanceMap(
  startPositions: RoomPosition[],
  costMatrix: CostMatrix
): ReferenceDistanceMap {
  // Initialize data structures
  const frontier: State[] = [];
  const visited = new Set<number>();
  const distanceMap = new ReferenceDistanceMap();

  // Set initial distances for start positions
  for (const pos of startPositions) {
    const state: State = { cost: 0, position: { x: pos.x, y: pos.y } };
    frontier.push(state);
    distanceMap.set(pos.x, pos.y, 0);
    visited.add(pos.x * 50 + pos.y);
  }

  // Process the frontier queue (maintaining it as a priority queue)
  while (frontier.length > 0) {
    // Find and remove minimum cost state
    let minIndex = 0;
    for (let i = 1; i < frontier.length; i++) {
      if (frontier[i].cost < frontier[minIndex].cost) {
        minIndex = i;
      }
    }
    const current = frontier.splice(minIndex, 1)[0];

    // If we've found a longer path, skip
    if (current.cost > distanceMap.get(current.position.x, current.position.y)) {
      continue;
    }

    const positionIsEdge = isEdge(current.position);

    // Check all neighboring positions
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;

        const newX = current.position.x + dx;
        const newY = current.position.y + dy;

        // Cannot move from one edge tile to another
        if (positionIsEdge && isEdge({ x: newX, y: newY })) continue;

        // Skip if out of bounds
        if (newX < 0 || newX > 49 || newY < 0 || newY > 49) continue;

        const terrainCost = costMatrix.get(newX, newY);
        if (terrainCost >= 255) continue;

        const nextCost = current.cost + terrainCost;
        const neighborPacked = newX * 50 + newY;

        if (!visited.has(neighborPacked) || nextCost < distanceMap.get(newX, newY)) {
          frontier.push({
            cost: nextCost,
            position: { x: newX, y: newY }
          });
          distanceMap.set(newX, newY, nextCost);
          visited.add(neighborPacked);
        }
      }
    }
  }

  return distanceMap;
}
