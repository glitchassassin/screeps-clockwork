import {
  ClockworkCostMatrix,
  ClockworkPath,
  astarMultiroomDistanceMap,
  ephemeral,
  getTerrainCostMatrix
} from '../../../../src/index';
import { ClockworkMultiroomDistanceMap } from '../../../../src/wrappers/multiroomDistanceMap';
import { cpuTime } from '../../../utils/cpuTime';
import { describe, expect, it } from '../../helpers';
const UNREACHABLE = 0xffffffff;

describe('astarMultiroomDistanceMap', () => {
  it('should calculate the distance map for an empty room', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(
      astarMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], [new RoomPosition(30, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxTiles: 2500
      })
    );
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N1'))).toBe(0);
    expect(distanceMap.get(new RoomPosition(26, 25, 'W1N1'))).toBe(1);
    // should not explore further than it needs to
    expect(distanceMap.get(new RoomPosition(1, 1, 'W1N1'))).toBe(UNREACHABLE);
  });

  it('should factor in terrain costs', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    // Add high-cost terrain
    for (let x = 10; x < 40; x++) {
      costMatrix.set(x, 25, 10);
    }
    const distanceMap = ephemeral(
      astarMultiroomDistanceMap([new RoomPosition(25, 26, 'W1N1')], [new RoomPosition(25, 23, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxTiles: 2500
      })
    );
    expect(distanceMap.get(new RoomPosition(25, 26, 'W1N1'))).toBe(0);
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N1'))).toBe(10);
    expect(distanceMap.get(new RoomPosition(25, 24, 'W1N1'))).toBe(11);
    // should not explore further than it needs to
    expect(distanceMap.get(new RoomPosition(1, 1, 'W1N1'))).toBe(UNREACHABLE);
  });

  it('should throw for invalid cost matrixes', () => {
    // cost matrix is a Screeps CostMatrix
    expect(() =>
      astarMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], [new RoomPosition(25, 23, 'W1N1')], {
        costMatrixCallback: () => new PathFinder.CostMatrix() as any
      })
    ).toThrow('Invalid ClockworkCostMatrix');

    // cost matrix is an invalid value
    expect(() =>
      astarMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], [new RoomPosition(25, 23, 'W1N1')], {
        costMatrixCallback: () => 'foo' as any
      })
    ).toThrow('Invalid ClockworkCostMatrix');

    // cost matrix was already freed
    expect(() => {
      const costMatrix = new ClockworkCostMatrix();
      costMatrix.free();
      astarMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], [new RoomPosition(25, 23, 'W1N1')], {
        costMatrixCallback: () => costMatrix
      });
    }).toThrow('Invalid ClockworkCostMatrix');
  });

  it('should skip rooms if cost matrix is undefined', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(
      astarMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], [new RoomPosition(25, 23, 'W1N1')], {
        costMatrixCallback: roomName => (roomName === 'W1N1' ? costMatrix : undefined),
        maxTiles: 2500
      })
    );
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N1'))).toBe(0);
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N2'))).toBe(UNREACHABLE);
    expect(distanceMap.get(new RoomPosition(25, 25, 'W2N1'))).toBe(UNREACHABLE);
  });
  it('should respect maxTiles', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(
      astarMultiroomDistanceMap([new RoomPosition(1, 1, 'W1N1')], [new RoomPosition(48, 48, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxTiles: 100
      })
    );
    let explored = 0;
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        if (distanceMap.get(new RoomPosition(x, y, 'W1N1')) !== UNREACHABLE) {
          explored++;
        }
      }
    }
    expect(explored).toBeLessThan(101);
  }, 10);
  it('should respect maxTileDistance', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(
      astarMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], [new RoomPosition(48, 48, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxTileDistance: 10
      })
    );
    let explored = 0;
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        if (distanceMap.get(new RoomPosition(x, y, 'W1N1')) !== UNREACHABLE) {
          explored++;
        }
      }
    }
    expect(explored).toBe(21 * 21);
  });
  it('should be faster than PathFinder.search', () => {
    const from = new RoomPosition(5, 5, 'W1N1');
    const to = new RoomPosition(45, 45, 'W1N1');
    const iterations = 50;

    let pathFinderPath: PathFinderPath;
    const visitedRooms = new Set<string>();
    const pathFinderTime = cpuTime(() => {
      pathFinderPath = PathFinder.search(from, to, {
        maxCost: 1500,
        maxOps: 10000,
        roomCallback: roomName => {
          visitedRooms.add(roomName);
          return new PathFinder.CostMatrix();
        },
        heuristicWeight: 1
      });
    }, iterations);

    let clockworkDistanceMap: ClockworkMultiroomDistanceMap;
    let clockworkPath: ClockworkPath;
    const cache = new Map<string, ClockworkCostMatrix>();
    ephemeral(
      astarMultiroomDistanceMap([from], [to], {
        costMatrixCallback: roomName => {
          if (cache.has(roomName)) {
            return cache.get(roomName);
          }
          const costMatrix = ephemeral(getTerrainCostMatrix(roomName));
          cache.set(roomName, costMatrix);
          return costMatrix;
        }
      })
    );

    const clockworkTime = cpuTime(() => {
      clockworkDistanceMap = ephemeral(
        astarMultiroomDistanceMap([from], [to], {
          costMatrixCallback: roomName => {
            if (cache.has(roomName)) {
              return cache.get(roomName);
            }
            const costMatrix = ephemeral(getTerrainCostMatrix(roomName));
            cache.set(roomName, costMatrix);
            return costMatrix;
          }
        })
      );
      clockworkPath = clockworkDistanceMap.pathToOrigin(to);
    }, iterations);

    console.log('Clockwork Time', clockworkTime);
    console.log('Clockwork Path', clockworkPath!.length);
    console.log('PathFinder Time', pathFinderTime);
    console.log('PathFinder Path', pathFinderPath!.path.length);

    expect(clockworkPath!.length).toBeLessThan(pathFinderPath!.path.length + 1); // less than or equal
    expect(clockworkTime).toBeLessThan(pathFinderTime);
  }, 50);
});
