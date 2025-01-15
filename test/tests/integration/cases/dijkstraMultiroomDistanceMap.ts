import { ClockworkCostMatrix, dijkstraMultiroomDistanceMap, ephemeral } from '../../../../src/index';
import { describe, expect, it } from '../../helpers';

const UNREACHABLE = 0xffffffff;

describe('dijkstraMultiroomDistanceMap', () => {
  it('should calculate the distance map for an empty room', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(
      dijkstraMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRooms: 1,
        maxTiles: 2500
      })
    );
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N1'))).toBe(0);
    expect(distanceMap.get(new RoomPosition(26, 25, 'W1N1'))).toBe(1);
    expect(distanceMap.get(new RoomPosition(1, 1, 'W1N1'))).toBe(24);
  });

  it('should factor in terrain costs', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    // Add high-cost terrain
    for (let x = 10; x < 40; x++) {
      costMatrix.set(x, 25, 10);
    }
    const distanceMap = ephemeral(
      dijkstraMultiroomDistanceMap([new RoomPosition(25, 26, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRooms: 1,
        maxTiles: 2500
      })
    );
    expect(distanceMap.get(new RoomPosition(25, 26, 'W1N1'))).toBe(0);
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N1'))).toBe(10);
    expect(distanceMap.get(new RoomPosition(25, 24, 'W1N1'))).toBe(11);
  });

  it('should throw for invalid cost matrixes', () => {
    // cost matrix is a Screeps CostMatrix
    expect(() =>
      dijkstraMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => new PathFinder.CostMatrix() as any,
        maxRooms: 1
      })
    ).toThrow('Invalid ClockworkCostMatrix');

    // cost matrix is an invalid value
    expect(() =>
      dijkstraMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => 'foo' as any,
        maxRooms: 1
      })
    ).toThrow('Invalid ClockworkCostMatrix');

    // cost matrix was already freed
    expect(() => {
      const costMatrix = new ClockworkCostMatrix();
      costMatrix.free();
      dijkstraMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRooms: 1
      });
    }).toThrow('Invalid ClockworkCostMatrix');
  });

  it('should skip rooms if cost matrix is undefined', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(
      dijkstraMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
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
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(
      dijkstraMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRooms: 2,
        maxTiles: 10000
      })
    );
    expect(distanceMap.getRooms().length).toBe(2);
  }, 10);
  it('should respect maxTiles', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(
      dijkstraMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
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
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(
      dijkstraMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
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
  it('should respect anyOfDestinations', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(
      dijkstraMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
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
      dijkstraMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        allOfDestinations: [new RoomPosition(25, 27, 'W1N1'), new RoomPosition(25, 21, 'W1N1')]
      })
    );
    expect(distanceMap.get(new RoomPosition(25, 25, 'W1N1'))).toBe(0);
    expect(distanceMap.get(new RoomPosition(25, 27, 'W1N1'))).toBe(2);
    expect(distanceMap.get(new RoomPosition(25, 21, 'W1N1'))).toBe(4);
    expect(distanceMap.get(new RoomPosition(25, 1, 'W1N1'))).toBe(UNREACHABLE);
  });
});
