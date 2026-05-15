import { bfsMultiroomDistanceMap, ClockworkCostMatrix, DirectionOrder } from '../../../../src/index';
import { describe, expect, it } from '../../helpers';

describe('bfsMultiroomMonoFlowField', () => {
  function distanceMapWithEmptyRoom(costMatrix: ClockworkCostMatrix) {
    return bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
      costMatrixCallback: () => costMatrix,
      maxRooms: 1
    }).distanceMap;
  }

  it('should calculate the mono flow field for an empty room', () => {
    /**
     * ........................*.........................
     * ........................^.........................
     * ........................1.........................
     */
    const costMatrix = new ClockworkCostMatrix();
    const distanceMap = distanceMapWithEmptyRoom(costMatrix);
    const flowField = distanceMap.toMonoFlowField();
    expect(flowField.get(new RoomPosition(25, 25, 'W1N1'))).toBeNull();
    expect(flowField.get(new RoomPosition(26, 25, 'W1N1'))).toBe(LEFT);
    expect(flowField.get(new RoomPosition(0, 0, 'W1N1'))).toBeNull();
  });

  it('should prefer diagonal directions when requested', () => {
    const costMatrix = new ClockworkCostMatrix();
    const defaultFlowField = distanceMapWithEmptyRoom(costMatrix).toMonoFlowField();
    const diagonalFlowField = distanceMapWithEmptyRoom(costMatrix).toMonoFlowField({
      directionOrder: DirectionOrder.DiagonalFirst
    });
    const position = new RoomPosition(27, 26, 'W1N1');

    expect(defaultFlowField.get(position)).toBe(LEFT);
    expect(diagonalFlowField.get(position)).toBe(TOP_LEFT);
  });
});
