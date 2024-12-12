import { bfsMultiroomDistanceMap, ClockworkCostMatrix, ephemeral } from '../../../../src/index';
import { describe, expect, it } from '../../helpers';

describe('bfsMultiroomMonoFlowField', () => {
  it('should calculate the mono flow field for an empty room', () => {
    /**
     * ........................*.........................
     * ........................^.........................
     * ........................1.........................
     */
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const distanceMap = ephemeral(
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback: () => costMatrix,
        maxRooms: 1
      })
    );
    const flowField = ephemeral(distanceMap.toMonoFlowField());
    expect(flowField.get(new RoomPosition(25, 25, 'W1N1'))).toBeNull();
    expect(flowField.get(new RoomPosition(26, 25, 'W1N1'))).toBe(LEFT);
    expect(flowField.get(new RoomPosition(0, 0, 'W1N1'))).toBeNull();
  });
});
