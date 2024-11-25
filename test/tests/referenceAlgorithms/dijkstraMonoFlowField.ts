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

type State = {
  cost: number;
  pos: Coord;
};

/**
 * Creates a mono flow field using Dijkstra's algorithm.
 * Each tile stores a single direction pointing back towards the nearest target,
 * accounting for terrain costs.
 */
export function referenceDijkstraMonoFlowField(
  startPositions: RoomPosition[],
  costMatrix: CostMatrix
): ReferenceMonoFlowField {
  // Initialize data structures
  const frontier: State[] = [];
  const visited = new Set<number>();
  const costs = new Map<number, number>();
  const flowField = new ReferenceMonoFlowField();

  // Initialize with start positions
  for (const pos of startPositions) {
    const state = { cost: 0, pos: { x: pos.x, y: pos.y } };
    frontier.push(state);
    flowField.set(pos.x, pos.y, 0);
    costs.set(pos.x * 50 + pos.y, 0);
    visited.add(pos.x * 50 + pos.y);
  }

  // Process the frontier queue (maintain sorted by cost)
  while (frontier.length > 0) {
    // Get lowest cost state (simulating priority queue)
    frontier.sort((a, b) => b.cost - a.cost);
    const current = frontier.pop()!;
    const currentKey = current.pos.x * 50 + current.pos.y;

    // Skip if we've found a better path
    if (current.cost > (costs.get(currentKey) ?? Infinity)) {
      continue;
    }

    // Check all neighboring positions
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;

        const newX = current.pos.x + dx;
        const newY = current.pos.y + dy;
        const neighborKey = newX * 50 + newY;

        // Skip if out of bounds
        if (newX < 0 || newX > 49 || newY < 0 || newY > 49) continue;

        const terrainCost = costMatrix.get(newX, newY);
        if (terrainCost >= 255) continue;

        const nextCost = current.cost + terrainCost;

        if (!visited.has(neighborKey) || nextCost < (costs.get(neighborKey) ?? Infinity)) {
          frontier.push({ cost: nextCost, pos: { x: newX, y: newY } });
          const direction = getDirection(-dx, -dy);
          flowField.set(newX, newY, direction);
          costs.set(neighborKey, nextCost);
          visited.add(neighborKey);
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
