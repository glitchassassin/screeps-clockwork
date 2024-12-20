import { ClockworkCostMatrix, ClockworkPath, ephemeral, getTerrainCostMatrix, jpsPath } from '../../../../src/index';
import { cpuTime } from '../../../utils/cpuTime';
import { describe, expect, it } from '../../helpers';
const UNREACHABLE = 0xffffffff;

describe('jpsPath', () => {
  it('should calculate the path for an empty room', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const path = ephemeral(
      jpsPath([new RoomPosition(25, 25, 'W1N1')], [new RoomPosition(30, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxOps: 10000
      })
    );
    expect(path.get(0).isEqualTo(new RoomPosition(25, 25, 'W1N1'))).toBeTruthy();
    expect(path.get(path.length - 1).isEqualTo(new RoomPosition(30, 25, 'W1N1'))).toBeTruthy();
  });

  it('should factor in terrain costs', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    // Add high-cost terrain
    for (let x = 10; x < 40; x++) {
      costMatrix.set(x, 25, 10);
    }
    const path = ephemeral(
      jpsPath([new RoomPosition(25, 26, 'W1N1')], [new RoomPosition(25, 23, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxOps: 10000
      })
    );
    expect(path.get(0).isEqualTo(new RoomPosition(25, 26, 'W1N1'))).toBeTruthy();
    expect(path.get(path.length - 1).isEqualTo(new RoomPosition(25, 23, 'W1N1'))).toBeTruthy();
    expect(path.length).toBeGreaterThan(3);
  });

  it('should throw for invalid cost matrixes', () => {
    // cost matrix is a Screeps CostMatrix
    expect(() =>
      jpsPath([new RoomPosition(25, 25, 'W1N1')], [new RoomPosition(25, 23, 'W1N1')], {
        costMatrixCallback: () => new PathFinder.CostMatrix() as any
      })
    ).toThrow('Invalid ClockworkCostMatrix');

    // cost matrix is an invalid value
    expect(() =>
      jpsPath([new RoomPosition(25, 25, 'W1N1')], [new RoomPosition(25, 23, 'W1N1')], {
        costMatrixCallback: () => 'foo' as any
      })
    ).toThrow('Invalid ClockworkCostMatrix');

    // cost matrix was already freed
    expect(() => {
      const costMatrix = new ClockworkCostMatrix();
      costMatrix.free();
      jpsPath([new RoomPosition(25, 25, 'W1N1')], [new RoomPosition(25, 23, 'W1N1')], {
        costMatrixCallback: () => costMatrix
      });
    }).toThrow('Invalid ClockworkCostMatrix');
  });
  it('should be faster than PathFinder.search', () => {
    const from = new RoomPosition(5, 5, 'W1N1');
    const to = new RoomPosition(45, 45, 'W3N3');
    const iterations = 1;

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

    let clockworkPath: ClockworkPath;
    const cache = new Map<string, ClockworkCostMatrix>();
    ephemeral(
      jpsPath([from], [to], {
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
      clockworkPath = ephemeral(
        jpsPath([from], [to], {
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
    }, iterations);

    console.log('Clockwork Time', clockworkTime);
    console.log('Clockwork Path', clockworkPath!.length);
    console.log('PathFinder Time', pathFinderTime);
    console.log('PathFinder Path', pathFinderPath!.path.length);

    expect(clockworkPath!.length).toBeLessThan(pathFinderPath!.path.length + 1); // less than or equal
    expect(clockworkTime).toBeLessThan(pathFinderTime);
  }, 50);
});
