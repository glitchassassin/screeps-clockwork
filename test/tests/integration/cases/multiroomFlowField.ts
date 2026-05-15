import { bfsMultiroomDistanceMap, ClockworkCostMatrix, DirectionOrder, ephemeral } from '../../../../src/index';
import { describe, expect, it } from '../../helpers';

describe('bfsMultiroomFlowField', () => {
  function distanceMapWithEmptyRoom(costMatrix: ClockworkCostMatrix) {
    return ephemeral(
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRooms: 1
      }).distanceMap
    );
  }

  it('should calculate the flow field for an empty room', () => {
    /**
     * ........................*.........................
     * ........................^.........................
     * ........................1.........................
     */
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const distanceMap = distanceMapWithEmptyRoom(costMatrix);
    const flowField = ephemeral(distanceMap.toFlowField());
    expect(flowField.getDirections(new RoomPosition(25, 25, 'W1N1'))).toEqual([]);
    expect(flowField.getDirections(new RoomPosition(26, 25, 'W1N1'))).toEqual([LEFT]);
    expect(flowField.getDirections(new RoomPosition(0, 0, 'W1N1'))).toEqual([]);
  });

  it('should order tied directions with diagonals first when requested', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const defaultFlowField = ephemeral(distanceMapWithEmptyRoom(costMatrix).toFlowField());
    const diagonalFlowField = ephemeral(
      distanceMapWithEmptyRoom(costMatrix).toFlowField({ directionOrder: DirectionOrder.DiagonalFirst })
    );
    const position = new RoomPosition(27, 26, 'W1N1');

    expect(defaultFlowField.getDirections(position)).toEqual([LEFT, TOP_LEFT]);
    expect(diagonalFlowField.getDirections(position)).toEqual([TOP_LEFT, LEFT]);
  });
});
