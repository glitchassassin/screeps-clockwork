import { ReferenceDistanceMap } from './bfsDistanceMap';

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

function isEdge(pos: Coord) {
  return pos.x === 0 || pos.x === 49 || pos.y === 0 || pos.y === 49;
}

/**
 * Creates a mono flow field for the given distance map.
 * Each tile stores a single direction pointing back towards the nearest target.
 *
 * @param distanceMap Distance map where each position stores a distance
 * @returns A flow field where each position stores a direction (1-8) or 0 for no direction
 */
export function referenceMonoFlowField(distanceMap: ReferenceDistanceMap): ReferenceMonoFlowField {
  const flowField = new ReferenceMonoFlowField();

  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      const currentDist = distanceMap.get(x, y);
      if (currentDist === Infinity) continue;

      let minNeighborDist = Infinity;
      let direction: DirectionConstant | 0 = 0;

      for (const { dx, dy } of DIRECTION_MAP) {
        if (dx === 0 && dy === 0) continue;

        const newX = x + dx;
        const newY = y + dy;

        if (newX < 0 || newX > 49 || newY < 0 || newY > 49) continue;
        if (isEdge({ x: newX, y: newY }) && !(isEdge({ x, y }) && distanceMap.get(newX, newY) === 0)) continue;

        const neighborDist = distanceMap.get(newX, newY);
        if (neighborDist < minNeighborDist) {
          minNeighborDist = neighborDist;
          direction = getDirection(dx, dy);
        }
      }

      if (minNeighborDist < currentDist) {
        flowField.set(x, y, direction);
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
  return (DIRECTION_MAP.findIndex(dir => dir.dx === dx && dir.dy === dy) + 1) as DirectionConstant | 0;
}

const DIRECTION_MAP = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 1, dy: 1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: -1, dy: -1 }
];
