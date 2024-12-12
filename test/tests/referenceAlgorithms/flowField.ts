import { Coord, ReferenceDistanceMap } from './bfsDistanceMap';

function isEdge(pos: Coord) {
  return pos.x === 0 || pos.x === 49 || pos.y === 0 || pos.y === 49;
}

export class ReferenceFlowField {
  internal: DirectionConstant[][] = new Array(50 * 50).fill([]);

  setDirections(x: number, y: number, directions: DirectionConstant[]) {
    this.internal[x * 50 + y] = directions;
  }

  getDirections(x: number, y: number): DirectionConstant[] {
    return this.internal[x * 50 + y] || [];
  }
}

export function referenceFlowField(distanceMap: ReferenceDistanceMap): ReferenceFlowField {
  const flowField = new ReferenceFlowField();

  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      const currentDist = distanceMap.get(x, y);
      if (currentDist === 0xffffffff) continue;

      const currentIsEdge = isEdge({ x, y });
      const neighbors: Coord[] = DIRECTION_MAP.map(({ dx, dy }) => ({ x: x + dx, y: y + dy })).filter(
        neighbor =>
          neighbor.x >= 0 &&
          neighbor.x < 50 &&
          neighbor.y >= 0 &&
          neighbor.y < 50 &&
          (!isEdge(neighbor) || (!currentIsEdge && distanceMap.get(neighbor.x, neighbor.y) === 0))
      );

      // Find minimum distance among neighbors
      const minDistance = Math.min(...neighbors.map(n => distanceMap.get(n.x, n.y)), 0xffffffff);

      if (minDistance !== 0xffffffff && minDistance < currentDist) {
        // Get all directions to neighbors with minimum distance
        const directions = neighbors
          .filter(n => distanceMap.get(n.x, n.y) === minDistance)
          .map(n => getDirection({ x, y }, n));

        flowField.setDirections(x, y, directions);
      }
    }
  }

  return flowField;
}

function getDirection(from: Coord, to: Coord): DirectionConstant {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const index = DIRECTION_MAP.findIndex(dir => dir.dx === dx && dir.dy === dy);
  if (index === -1) throw new Error('Invalid direction');
  return (index + 1) as DirectionConstant;
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
