import {
  ClockworkCostMatrix,
  ClockworkPath,
  astarMultiroomDistanceMap,
  dijkstraMultiroomDistanceMap,
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
      astarMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxOps: 2500,
        anyOfDestinations: [new RoomPosition(30, 25, 'W1N1')]
      })
    );
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N1'))).toBe(0);
    expect(distanceMap.get(new RoomPosition(26, 25, 'W1N1'))).toBe(1);
    expect(distanceMap.get(new RoomPosition(1, 1, 'W1N1'))).toBe(UNREACHABLE);
  });

  it('should factor in terrain costs', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    // Add high-cost terrain
    for (let x = 10; x < 40; x++) {
      costMatrix.set(x, 25, 10);
    }
    const distanceMap = ephemeral(
      astarMultiroomDistanceMap([new RoomPosition(25, 26, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxOps: 2500,
        anyOfDestinations: [new RoomPosition(25, 23, 'W1N1')]
      })
    );
    expect(distanceMap.get(new RoomPosition(25, 26, 'W1N1'))).toBe(0);
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N1'))).toBe(10);
    expect(distanceMap.get(new RoomPosition(25, 24, 'W1N1'))).toBe(11);
    expect(distanceMap.get(new RoomPosition(1, 1, 'W1N1'))).toBe(UNREACHABLE);
  });

  it('should throw for invalid cost matrixes', () => {
    expect(() =>
      astarMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => new PathFinder.CostMatrix() as any,
        anyOfDestinations: [new RoomPosition(25, 23, 'W1N1')]
      })
    ).toThrow('Invalid ClockworkCostMatrix');

    expect(() =>
      astarMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => 'foo' as any,
        anyOfDestinations: [new RoomPosition(25, 23, 'W1N1')]
      })
    ).toThrow('Invalid ClockworkCostMatrix');

    expect(() => {
      const costMatrix = new ClockworkCostMatrix();
      costMatrix.free();
      astarMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        anyOfDestinations: [new RoomPosition(25, 23, 'W1N1')]
      });
    }).toThrow('Invalid ClockworkCostMatrix');
  });

  it('should skip rooms if cost matrix is undefined', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(
      astarMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: roomName => (roomName === 'W1N1' ? costMatrix : undefined),
        maxOps: 2500,
        anyOfDestinations: [new RoomPosition(25, 23, 'W1N1')]
      })
    );
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N1'))).toBe(0);
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N2'))).toBe(UNREACHABLE);
    expect(distanceMap.get(new RoomPosition(25, 25, 'W2N1'))).toBe(UNREACHABLE);
  });
  it('should respect maxOps', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(
      astarMultiroomDistanceMap([new RoomPosition(1, 1, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxOps: 100,
        anyOfDestinations: [new RoomPosition(48, 48, 'W1N1')]
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
  it('should respect maxPathCost', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(
      astarMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxPathCost: 10,
        anyOfDestinations: [new RoomPosition(48, 48, 'W1N1')]
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
      astarMultiroomDistanceMap([from], {
        costMatrixCallback: roomName => {
          if (cache.has(roomName)) {
            return cache.get(roomName);
          }
          const costMatrix = ephemeral(getTerrainCostMatrix(roomName));
          cache.set(roomName, costMatrix);
          return costMatrix;
        },
        anyOfDestinations: [to]
      })
    );

    const clockworkTime = cpuTime(() => {
      clockworkDistanceMap = ephemeral(
        astarMultiroomDistanceMap([from], {
          costMatrixCallback: roomName => {
            if (cache.has(roomName)) {
              return cache.get(roomName);
            }
            const costMatrix = ephemeral(getTerrainCostMatrix(roomName));
            cache.set(roomName, costMatrix);
            return costMatrix;
          },
          anyOfDestinations: [to]
        })
      );
      clockworkPath = clockworkDistanceMap.pathToOrigin(to);
    }, iterations);

    console.log('Clockwork Time', clockworkTime);
    console.log('Clockwork Path', clockworkPath!.length);
    console.log('PathFinder Time', pathFinderTime);
    console.log('PathFinder Path', pathFinderPath!.path.length);

    // clockwork path includes the origin, so we add 1 to the path length.
    expect(clockworkPath!.length).toBeLessThanOrEqual(pathFinderPath!.path.length + 1);
    expect(clockworkTime).toBeLessThan(pathFinderTime);
  }, 50);

  it('should respect anyOfDestinations', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(
      astarMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        anyOfDestinations: [new RoomPosition(25, 27, 'W1N1'), new RoomPosition(25, 21, 'W1N1')]
      })
    );
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N1'))).toBe(0);
    expect(distanceMap.get(new RoomPosition(25, 27, 'W1N1'))).toBe(2);
    expect(distanceMap.get(new RoomPosition(25, 21, 'W1N1'))).toBe(UNREACHABLE);
    expect(distanceMap.get(new RoomPosition(25, 1, 'W1N1'))).toBe(UNREACHABLE);
  });

  it('should respect allOfDestinations', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(
      astarMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        allOfDestinations: [new RoomPosition(25, 27, 'W1N1'), new RoomPosition(25, 21, 'W1N1')]
      })
    );
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N1'))).toBe(0);
    expect(distanceMap.get(new RoomPosition(25, 27, 'W1N1'))).toBe(2);
    expect(distanceMap.get(new RoomPosition(25, 21, 'W1N1'))).toBe(4);
    expect(distanceMap.get(new RoomPosition(25, 1, 'W1N1'))).toBe(UNREACHABLE);
  });

  it('should beat Dijkstra for anyOfDestinations', () => {
    const from = new RoomPosition(5, 5, 'W1N1');
    const to = [
      new RoomPosition(45, 45, 'W1N1'),
      new RoomPosition(5, 45, 'W1N1'),
      new RoomPosition(45, 5, 'W1N2'),
      new RoomPosition(5, 5, 'W1N2')
    ];
    const iterations = 10;

    let dijkstraDistanceMap: ClockworkMultiroomDistanceMap;
    let dijkstraPath: ClockworkPath;
    const cache = new Map<string, ClockworkCostMatrix>();
    const dijkstraTime = cpuTime(() => {
      dijkstraDistanceMap = ephemeral(
        dijkstraMultiroomDistanceMap([from], {
          costMatrixCallback: roomName => {
            if (cache.has(roomName)) {
              return cache.get(roomName);
            }
            const costMatrix = ephemeral(getTerrainCostMatrix(roomName));
            cache.set(roomName, costMatrix);
            return costMatrix;
          },
          anyOfDestinations: to
        })
      );
    }, iterations);

    let astarDistanceMap: ClockworkMultiroomDistanceMap;
    let astarPath: ClockworkPath;
    const astarTime = cpuTime(() => {
      astarDistanceMap = ephemeral(
        astarMultiroomDistanceMap([from], {
          costMatrixCallback: roomName => {
            if (cache.has(roomName)) {
              return cache.get(roomName);
            }
            const costMatrix = ephemeral(getTerrainCostMatrix(roomName));
            cache.set(roomName, costMatrix);
            return costMatrix;
          },
          anyOfDestinations: to
        })
      );
    }, iterations);

    console.log('A* Time', astarTime);
    console.log('Dijkstra Time', dijkstraTime);

    expect(astarTime).toBeLessThan(dijkstraTime);
  }, 50);

  it('should beat Dijkstra for allOfDestinations', () => {
    const from = new RoomPosition(5, 5, 'W1N1');
    const to = [
      new RoomPosition(45, 45, 'W1N1'),
      new RoomPosition(5, 45, 'W1N1'),
      new RoomPosition(45, 5, 'W1N2'),
      new RoomPosition(5, 5, 'W1N2')
    ];
    const iterations = 10;

    let dijkstraDistanceMap: ClockworkMultiroomDistanceMap;
    let dijkstraPath: ClockworkPath;
    const cache = new Map<string, ClockworkCostMatrix>();
    const dijkstraTime = cpuTime(() => {
      dijkstraDistanceMap = ephemeral(
        dijkstraMultiroomDistanceMap([from], {
          costMatrixCallback: roomName => {
            if (cache.has(roomName)) {
              return cache.get(roomName);
            }
            const costMatrix = ephemeral(getTerrainCostMatrix(roomName));
            cache.set(roomName, costMatrix);
            return costMatrix;
          },
          allOfDestinations: to
        })
      );
    }, iterations);

    let astarDistanceMap: ClockworkMultiroomDistanceMap;
    let astarPath: ClockworkPath;
    const astarTime = cpuTime(() => {
      astarDistanceMap = ephemeral(
        astarMultiroomDistanceMap([from], {
          costMatrixCallback: roomName => {
            if (cache.has(roomName)) {
              return cache.get(roomName);
            }
            const costMatrix = ephemeral(getTerrainCostMatrix(roomName));
            cache.set(roomName, costMatrix);
            return costMatrix;
          },
          allOfDestinations: to
        })
      );
    }, iterations);

    console.log('A* Time', astarTime);
    console.log('Dijkstra Time', dijkstraTime);

    expect(astarTime).toBeLessThan(dijkstraTime);
  }, 50);
});
