import { Coord, referenceBfsDistanceMap } from './bfsDistanceMap';

function isEdge(pos: Coord) {
  return pos.x === 0 || pos.x === 49 || pos.y === 0 || pos.y === 49;
}

export class ReferenceFlowField {
  // Using a Map to store directions for each position
  internal = new Map<number, DirectionConstant[]>();

  setDirections(x: number, y: number, directions: DirectionConstant[]) {
    this.internal.set(x * 50 + y, directions);
  }

  getDirections(x: number, y: number): DirectionConstant[] {
    return this.internal.get(x * 50 + y) || [];
  }
}

/**
 * Creates a flow field for the given start positions, using a breadth-first search.
 * This does not factor in terrain costs (treating anything less than 255 in the cost
 * matrix as passable), so it's faster but less useful than Dijkstra's algorithm.
 *
 * @param startPositions Array of RoomPositions where the search should start from
 * @param costMatrix Cost matrix representing the terrain/obstacles
 * @returns A flow field where keys are packed positions and values are arrays of directions
 */
export function referenceBfsFlowField(startPositions: RoomPosition[], costMatrix: CostMatrix): ReferenceFlowField {
  const distanceMap = referenceBfsDistanceMap(startPositions, costMatrix);
  const flowField = new ReferenceFlowField();

  // Helper to get direction between two positions
  const getDirection = (from: { x: number; y: number }, to: { x: number; y: number }): DirectionConstant => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (dx === 1 && dy === 0) return RIGHT;
    if (dx === -1 && dy === 0) return LEFT;
    if (dx === 0 && dy === 1) return BOTTOM;
    if (dx === 0 && dy === -1) return TOP;
    if (dx === 1 && dy === 1) return BOTTOM_RIGHT;
    if (dx === 1 && dy === -1) return TOP_RIGHT;
    if (dx === -1 && dy === 1) return BOTTOM_LEFT;
    if (dx === -1 && dy === -1) return TOP_LEFT;
    throw new Error('Invalid direction');
  };

  // Process each position in the room
  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      const value = distanceMap.get(x, y);
      if (value === Infinity) continue; // Skip unreachable positions

      const positionIsEdge = isEdge({ x, y });

      // Get valid neighbors
      const neighbors: Coord[] = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const newX = x + dx;
          const newY = y + dy;
          if (positionIsEdge && isEdge({ x: newX, y: newY })) continue;
          if (newX < 0 || newX > 49 || newY < 0 || newY > 49) continue;
          if (costMatrix.get(newX, newY) < 255) {
            neighbors.push({ x: newX, y: newY });
          }
        }
      }

      // Find minimum distance among neighbors
      const minDistance = Math.min(...neighbors.map(n => distanceMap.get(n.x, n.y)));

      if (minDistance < value) {
        // Get all neighbors with minimum distance
        const bestNeighbors = neighbors.filter(n => distanceMap.get(n.x, n.y) === minDistance);
        const directions = bestNeighbors.map(n => getDirection({ x, y }, n));
        flowField.setDirections(x, y, directions);
      }
    }
  }

  return flowField;
}
