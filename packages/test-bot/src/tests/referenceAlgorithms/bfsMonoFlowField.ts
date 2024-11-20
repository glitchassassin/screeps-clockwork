export class ReferenceMonoFlowField {
  internal: (DirectionConstant | 0)[] = new Array(50 * 50).fill(0);

  get(x: number, y: number) {
    const value = this.internal[x * 50 + y];
    if (value === 0) return undefined;
    return value;
  }

  set(x: number, y: number, value: DirectionConstant | 0) {
    this.internal[x * 50 + y] = value;
  }
}

type Coord = {
  x: number;
  y: number;
};

/**
 * Creates a mono flow field for the given start positions, using a breadth-first search.
 * Each tile stores a single direction pointing back towards the nearest target.
 *
 * @param startPositions Array of RoomPositions where the search should start from
 * @param costMatrix Cost matrix representing the terrain/obstacles
 * @returns A flow field where each position stores a direction (1-8) or 0 for no direction
 */
export function referenceBfsMonoFlowField(
  startPositions: RoomPosition[],
  costMatrix: CostMatrix
): ReferenceMonoFlowField {
  // Initialize data structures
  const frontier: Coord[] = [...startPositions.map(pos => ({ x: pos.x, y: pos.y }))];
  const visited = new Set<number>(startPositions.map(pos => pos.x * 50 + pos.y));
  const flowField = new ReferenceMonoFlowField();

  // Set 0 initial directions for start positions
  for (const pos of startPositions) {
    flowField.set(pos.x, pos.y, 0);
  }

  // Process the frontier queue
  while (frontier.length > 0) {
    const currentPos = frontier.shift()!;

    // Check all neighboring positions
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;

        const newX = currentPos.x + dx;
        const newY = currentPos.y + dy;

        // Skip if out of bounds
        if (newX < 0 || newX > 49 || newY < 0 || newY > 49) continue;

        // If position is passable and not visited (no direction set)
        if (costMatrix.get(newX, newY) < 255 && !visited.has(newX * 50 + newY)) {
          // Calculate direction from neighbor back to current position
          const direction = getDirection(-dx, -dy);
          flowField.set(newX, newY, direction);
          frontier.push({ x: newX, y: newY });
          visited.add(newX * 50 + newY);
        } else {
          visited.add(newX * 50 + newY);
        }
      }
    }
  }

  return flowField;
}

/**
 * Convert dx,dy offset to direction number (1-8)
 * 1: TOP
 * 2: TOP_RIGHT
 * 3: RIGHT
 * etc...
 */
function getDirection(dx: number, dy: number): DirectionConstant | 0 {
  if (dx === 0 && dy === -1) return TOP;
  if (dx === 1 && dy === -1) return TOP_RIGHT;
  if (dx === 1 && dy === 0) return RIGHT;
  if (dx === 1 && dy === 1) return BOTTOM_RIGHT;
  if (dx === 0 && dy === 1) return BOTTOM;
  if (dx === -1 && dy === 1) return BOTTOM_LEFT;
  if (dx === -1 && dy === 0) return LEFT;
  if (dx === -1 && dy === -1) return TOP_LEFT;
  return 0;
}
