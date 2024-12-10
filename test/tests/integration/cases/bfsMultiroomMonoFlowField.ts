import { bfsMultiroomMonoFlowField, ClockworkCostMatrix } from '../../../../src/index';
import { describe, expect, it } from '../../helpers';

describe('bfsMultiroomMonoFlowField', () => {
  it('should calculate the mono flow field for an empty room', () => {
    /**
     * ........................*.........................
     * ........................^.........................
     * ........................1.........................
     */
    const costMatrix = new ClockworkCostMatrix();
    const flowField = bfsMultiroomMonoFlowField([new RoomPosition(25, 25, 'W1N1')], {
      costMatrixCallback: () => costMatrix,
      maxRooms: 1
    });
    costMatrix.free();
    expect(flowField.get(new RoomPosition(25, 25, 'W1N1'))).toBeNull();
    expect(flowField.get(new RoomPosition(26, 25, 'W1N1'))).toBe(LEFT);
    expect(flowField.get(new RoomPosition(0, 0, 'W1N1'))).toBeNull();
  });

  it('should skip rooms if cost matrix is undefined', () => {
    const costMatrix = new ClockworkCostMatrix();
    const flowField = bfsMultiroomMonoFlowField([new RoomPosition(25, 25, 'W1N1')], {
      costMatrixCallback: roomName => (roomName === 'W1N1' ? costMatrix : undefined),
      maxRooms: 4
    });
    costMatrix.free();
    expect(flowField.get(new RoomPosition(25, 25, 'W1N1'))).toBeNull();
    expect(flowField.get(new RoomPosition(25, 25, 'W1N2'))).toBeNull();
    expect(flowField.get(new RoomPosition(25, 25, 'W2N1'))).toBeNull();
  });

  it('should respect maxRooms', () => {
    const costMatrix = new ClockworkCostMatrix();
    const flowField = bfsMultiroomMonoFlowField([new RoomPosition(25, 25, 'W1N1')], {
      costMatrixCallback: () => costMatrix,
      maxRooms: 2
    });
    costMatrix.free();
    expect(flowField.getRooms().length).toBe(2);
  }, 10);

  it('should respect maxRoomDistance', () => {
    const costMatrix = new ClockworkCostMatrix();
    const flowField = bfsMultiroomMonoFlowField([new RoomPosition(25, 25, 'W1N1')], {
      costMatrixCallback: () => costMatrix,
      maxRoomDistance: 1
    });
    costMatrix.free();
    expect(flowField.getRooms().length).toBe(5);
  }, 15);

  it('should throw for invalid cost matrixes', () => {
    // cost matrix is a Screeps CostMatrix
    expect(() =>
      bfsMultiroomMonoFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => new PathFinder.CostMatrix() as any,
        maxRooms: 1
      })
    ).toThrow('Invalid ClockworkCostMatrix');

    // cost matrix is an invalid value
    expect(() =>
      bfsMultiroomMonoFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => 'foo' as any,
        maxRooms: 1
      })
    ).toThrow('Invalid ClockworkCostMatrix');

    // class with the same name, but not the real ClockworkCostMatrix
    expect(() => {
      class ClockworkCostMatrix {}
      bfsMultiroomMonoFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => new ClockworkCostMatrix() as any,
        maxRooms: 1
      });
    }).toThrow('Invalid ClockworkCostMatrix');

    // cost matrix was already freed
    expect(() => {
      const costMatrix = new ClockworkCostMatrix();
      costMatrix.free();
      bfsMultiroomMonoFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRooms: 1
      });
    }).toThrow('Invalid ClockworkCostMatrix');

    // cost matrix function error gets passed through
    expect(() => {
      bfsMultiroomMonoFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => {
          throw new Error('foo');
        },
        maxRooms: 1
      });
    }).toThrow('foo');
  });

  it('should respect maxTiles', () => {
    const costMatrix = new ClockworkCostMatrix();
    const flowField = bfsMultiroomMonoFlowField([new RoomPosition(25, 25, 'W1N1')], {
      costMatrixCallback: () => costMatrix,
      maxRooms: 1,
      maxTiles: 100
    });
    costMatrix.free();
    let explored = 0;
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        if (flowField.get(new RoomPosition(x, y, 'W1N1')) !== null) {
          explored++;
        }
      }
    }
    expect(explored).toBe(100 - 1); // -1 because the origin is not included
  });

  it('should respect maxTileDistance', () => {
    const costMatrix = new ClockworkCostMatrix();
    const flowField = bfsMultiroomMonoFlowField([new RoomPosition(25, 25, 'W1N1')], {
      costMatrixCallback: () => costMatrix,
      maxTileDistance: 10
    });
    costMatrix.free();
    let explored = 0;
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        if (flowField.get(new RoomPosition(x, y, 'W1N1')) !== null) {
          explored++;
        }
      }
    }
    expect(explored).toBe(21 * 21 - 1); // -1 because the origin is not included
  });
});
