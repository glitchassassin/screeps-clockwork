import { bfsMultiroomDistanceMap, ClockworkCostMatrix, ephemeral } from '../../../../src/index';
import { describe, expect, it } from '../../helpers';

const UNREACHABLE = 0xffffffff;

describe('bfsMultiroomDistanceMap', () => {
  it('should calculate the distance map for an empty room', () => {
    /**
     * ........................*.........................
     * ........................|.........................
     * ........................1.........................
     */
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const distanceMap = ephemeral(
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRooms: 1,
        maxTiles: 2500
      })
    );
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N1'))).toBe(0);
    expect(distanceMap.get(new RoomPosition(26, 25, 'W1N1'))).toBe(1);
    expect(distanceMap.get(new RoomPosition(1, 1, 'W1N1'))).toBe(24);
  });
  it('should throw for invalid cost matrixes', () => {
    // cost matrix is a Screeps CostMatrix
    expect(() =>
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => new PathFinder.CostMatrix() as any,
        maxRooms: 1
      })
    ).toThrow('Invalid ClockworkCostMatrix');

    // cost matrix is an invalid value
    expect(() =>
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => 'foo' as any,
        maxRooms: 1
      })
    ).toThrow('Invalid ClockworkCostMatrix');

    // class with the same name, but not the real ClockworkCostMatrix
    expect(() => {
      class ClockworkCostMatrix {}
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => new ClockworkCostMatrix() as any,
        maxRooms: 1
      });
    }).toThrow('Invalid ClockworkCostMatrix');

    // cost matrix was already freed
    expect(() => {
      const costMatrix = new ClockworkCostMatrix();
      costMatrix.free();
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRooms: 1
      });
    }).toThrow('Invalid ClockworkCostMatrix');

    // cost matrix function error gets passed through
    expect(() => {
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => {
          throw new Error('foo');
        },
        maxRooms: 1
      });
    }).toThrow('foo');
  });
  it('should skip rooms if cost matrix is undefined', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const distanceMap = ephemeral(
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: roomName => (roomName === 'W1N1' ? costMatrix : undefined),
        maxRooms: 4,
        maxTiles: 2500
      })
    );
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N1'))).toBe(0);
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N2'))).toBe(UNREACHABLE);
    expect(distanceMap.get(new RoomPosition(25, 25, 'W2N1'))).toBe(UNREACHABLE);
  });
  it('should respect maxRooms', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const distanceMap = ephemeral(
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRooms: 2,
        maxTiles: 10000
      })
    );
    expect(distanceMap.getRooms().length).toBe(2);
  });
  it('should respect maxRoomDistance', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const distanceMap = ephemeral(
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRoomDistance: 1
      })
    );
    expect(distanceMap.getRooms().length).toBe(5);
  }, 15);
  it('should respect maxTiles', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const distanceMap = ephemeral(
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRooms: 1,
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
    expect(explored).toBe(100);
  });
  it('should respect maxTileDistance', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const distanceMap = ephemeral(
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
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
});
