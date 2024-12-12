export class ReferenceDistanceMap {
  internal: number[] = new Array(50 * 50).fill(0xffffffff);

  get(x: number, y: number) {
    return this.internal[x * 50 + y];
  }

  set(x: number, y: number, value: number) {
    this.internal[x * 50 + y] = value;
  }

  toArray() {
    return this.internal;
  }
}

export type Coord = {
  x: number;
  y: number;
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
export function referenceBfsDistanceMap(startPositions: RoomPosition[], costMatrix: CostMatrix): ReferenceDistanceMap {
  // Initialize data structures
  const frontier: Coord[] = [...startPositions.map(pos => ({ x: pos.x, y: pos.y }))];
  const visited = new Set<number>();
  const distanceMap = new ReferenceDistanceMap();
  // Set initial distances for start positions
  for (const pos of startPositions) {
    const packedPos = pos.x * 50 + pos.y;
    distanceMap.set(pos.x, pos.y, 0);
    visited.add(packedPos);
  }

  // Process the frontier queue
  while (frontier.length > 0) {
    const currentPos = frontier.shift()!;
    const currentDistance = distanceMap.get(currentPos.x, currentPos.y);
    const positionIsEdge = isEdge(currentPos);

    // Check all neighboring positions
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;

        const newX = currentPos.x + dx;
        const newY = currentPos.y + dy;

        const newPositionIsEdge = isEdge({ x: newX, y: newY });

        // Cannot move from one edge tile to another
        if (newPositionIsEdge && positionIsEdge) {
          continue;
        }

        // Skip if out of bounds
        if (newX < 0 || newX > 49 || newY < 0 || newY > 49) continue;

        const neighborPacked = newX * 50 + newY;

        // If position is passable and not visited
        if (costMatrix.get(newX, newY) < 255 && !visited.has(neighborPacked)) {
          distanceMap.set(newX, newY, currentDistance + 1);
          frontier.push({ x: newX, y: newY });
          visited.add(neighborPacked);
        } else {
          visited.add(neighborPacked);
        }
      }
    }
  }

  return distanceMap;
}
