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
        maxOps: 2500
      }).distanceMap
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
        maxOps: 2500
      }).distanceMap
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
        maxOps: 10000
      }).distanceMap
    );
    expect(distanceMap.getRooms().length).toBe(2);
  }, 10);
  it('should respect maxOps', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const distanceMap = ephemeral(
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRooms: 1,
        maxOps: 100
      }).distanceMap
    );
    let explored = 0;
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        if (distanceMap.get(new RoomPosition(x, y, 'W1N1')) !== UNREACHABLE) {
          explored++;
        }
      }
    }
    expect(explored).toBeLessThan(150);
  });
  it('should respect maxPathCost', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const distanceMap = ephemeral(
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxPathCost: 10
      }).distanceMap
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
  it('should respect anyOfDestinations', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const distanceMap = ephemeral(
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        anyOfDestinations: [
          { pos: new RoomPosition(25, 27, 'W1N1'), range: 0 },
          { pos: new RoomPosition(25, 21, 'W1N1'), range: 0 }
        ]
      }).distanceMap
    );
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N1'))).toBe(0);
    expect(distanceMap.get(new RoomPosition(25, 27, 'W1N1'))).toBe(2);
    expect(distanceMap.get(new RoomPosition(25, 21, 'W1N1'))).toBe(UNREACHABLE);
    expect(distanceMap.get(new RoomPosition(25, 1, 'W1N1'))).toBe(UNREACHABLE);
  });
  it('should respect allOfDestinations', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const distanceMap = ephemeral(
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        allOfDestinations: [
          { pos: new RoomPosition(25, 27, 'W1N1'), range: 0 },
          { pos: new RoomPosition(25, 21, 'W1N1'), range: 0 }
        ]
      }).distanceMap
    );
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N1'))).toBe(0);
    expect(distanceMap.get(new RoomPosition(25, 27, 'W1N1'))).toBe(2);
    expect(distanceMap.get(new RoomPosition(25, 21, 'W1N1'))).toBe(4);
    expect(distanceMap.get(new RoomPosition(25, 1, 'W1N1'))).toBe(UNREACHABLE);
  });
  it('should find a target at range 10 from destination', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const searchResult = bfsMultiroomDistanceMap([new RoomPosition(5, 5, 'W1N1')], {
      costMatrixCallback: () => costMatrix,
      anyOfDestinations: [{ pos: new RoomPosition(45, 45, 'W1N1'), range: 10 }]
    });
    ephemeral(searchResult.distanceMap);

    expect(searchResult.foundTargets.some(pos => pos.getRangeTo(45, 45) === 10)).toBe(true);
  });
  it("should find origin when it's within range of target", () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const origin = new RoomPosition(5, 5, 'W1N1');
    const searchResult = bfsMultiroomDistanceMap([origin], {
      costMatrixCallback: () => costMatrix,
      anyOfDestinations: [{ pos: new RoomPosition(45, 45, 'W1N1'), range: 50 }]
    });
    ephemeral(searchResult.distanceMap);

    expect(searchResult.foundTargets.some(pos => pos.isEqualTo(origin))).toBe(true);
  });
  it('should find target in different room at range', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const searchResult = bfsMultiroomDistanceMap([new RoomPosition(5, 5, 'W1N1')], {
      costMatrixCallback: roomName => (roomName === 'W1N1' || roomName === 'W1N2' ? costMatrix : undefined),
      anyOfDestinations: [{ pos: new RoomPosition(45, 45, 'W1N2'), range: 50 }]
    });
    ephemeral(searchResult.distanceMap);

    expect(searchResult.foundTargets.every(pos => pos.roomName === 'W1N2')).toBe(true);
  });
});
