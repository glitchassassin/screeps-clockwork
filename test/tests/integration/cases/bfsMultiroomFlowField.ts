import { bfsMultiroomFlowField, ClockworkCostMatrix, ephemeral } from '../../../../src/index';
import { describe, expect, it } from '../../helpers';

describe('bfsMultiroomFlowField', () => {
  it('should calculate the flow field for an empty room', () => {
    /**
     * ........................*.........................
     * ........................^.........................
     * ........................1.........................
     */
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const flowField = ephemeral(
      bfsMultiroomFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRooms: 1
      })
    );
    expect(flowField.getDirections(new RoomPosition(25, 25, 'W1N1'))).toEqual([]);
    expect(flowField.getDirections(new RoomPosition(26, 25, 'W1N1'))).toEqual([LEFT]);
    expect(flowField.getDirections(new RoomPosition(0, 0, 'W1N1'))).toEqual([]);
  });

  it('should skip rooms if cost matrix is undefined', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const flowField = ephemeral(
      bfsMultiroomFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: roomName => (roomName === 'W1N1' ? costMatrix : undefined),
        maxRooms: 4
      })
    );
    expect(flowField.getDirections(new RoomPosition(25, 25, 'W1N1'))).toEqual([]);
    expect(flowField.getDirections(new RoomPosition(25, 25, 'W1N2'))).toEqual([]);
    expect(flowField.getDirections(new RoomPosition(25, 25, 'W2N1'))).toEqual([]);
  });

  it('should respect maxRooms', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const flowField = ephemeral(
      bfsMultiroomFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRooms: 2
      })
    );
    expect(flowField.getRooms().length).toBe(2);
  }, 10);

  it('should respect maxRoomDistance', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const flowField = ephemeral(
      bfsMultiroomFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRoomDistance: 1
      })
    );
    expect(flowField.getRooms().length).toBe(5);
  }, 15);

  it('should throw for invalid cost matrixes', () => {
    // cost matrix is a Screeps CostMatrix
    expect(() =>
      bfsMultiroomFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => new PathFinder.CostMatrix() as any,
        maxRooms: 1
      })
    ).toThrow('Invalid ClockworkCostMatrix');

    // cost matrix is an invalid value
    expect(() =>
      bfsMultiroomFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => 'foo' as any,
        maxRooms: 1
      })
    ).toThrow('Invalid ClockworkCostMatrix');

    // class with the same name, but not the real ClockworkCostMatrix
    expect(() => {
      class ClockworkCostMatrix {}
      bfsMultiroomFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => new ClockworkCostMatrix() as any,
        maxRooms: 1
      });
    }).toThrow('Invalid ClockworkCostMatrix');

    // cost matrix was already freed
    expect(() => {
      const costMatrix = new ClockworkCostMatrix();
      costMatrix.free();
      bfsMultiroomFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRooms: 1
      });
    }).toThrow('Invalid ClockworkCostMatrix');

    // cost matrix function error gets passed through
    expect(() => {
      bfsMultiroomFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => {
          throw new Error('foo');
        },
        maxRooms: 1
      });
    }).toThrow('foo');
  });

  it('should respect maxTiles', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const flowField = ephemeral(
      bfsMultiroomFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRooms: 1,
        maxTiles: 100
      })
    );
    let explored = 0;
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        if (flowField.getDirections(new RoomPosition(x, y, 'W1N1')).length > 0) {
          explored++;
        }
      }
    }
    expect(explored).toBe(100 - 1); // -1 because the origin is not included
  });

  it('should respect maxTileDistance', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const flowField = ephemeral(
      bfsMultiroomFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxTileDistance: 10
      })
    );
    let explored = 0;
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        if (flowField.getDirections(new RoomPosition(x, y, 'W1N1')).length > 0) {
          explored++;
        }
      }
    }
    expect(explored).toBe(21 * 21 - 1); // -1 because the origin is not included
  });
  it('should respect anyOfDestinations', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const flowField = ephemeral(
      bfsMultiroomFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        anyOfDestinations: [new RoomPosition(25, 27, 'W1N1')]
      })
    );
    expect(flowField.getDirections(new RoomPosition(25, 25, 'W1N1'))).toEqual([]);
    expect(flowField.getDirections(new RoomPosition(25, 27, 'W1N1'))).toEqual([TOP, TOP_RIGHT, TOP_LEFT]);
    expect(flowField.getDirections(new RoomPosition(25, 1, 'W1N1'))).toEqual([]);
  });
  it('should respect allOfDestinations', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const flowField = ephemeral(
      bfsMultiroomFlowField([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        allOfDestinations: [new RoomPosition(25, 27, 'W1N1'), new RoomPosition(25, 21, 'W1N1')]
      })
    );
    expect(flowField.getDirections(new RoomPosition(25, 25, 'W1N1'))).toEqual([]);
    expect(flowField.getDirections(new RoomPosition(25, 27, 'W1N1'))).toEqual([TOP, TOP_RIGHT, TOP_LEFT]);
    expect(flowField.getDirections(new RoomPosition(25, 21, 'W1N1'))).toEqual([BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT]);
    expect(flowField.getDirections(new RoomPosition(25, 1, 'W1N1'))).toEqual([]);
  });
});
