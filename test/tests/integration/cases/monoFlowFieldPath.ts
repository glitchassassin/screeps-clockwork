import { bfsMonoFlowField, ClockworkCostMatrix, ephemeral } from '../../../../src/index';
import { describe, expect, it } from '../../helpers';

describe('monoFlowFieldPath', () => {
  it('should calculate a path from a mono flow field', () => {
    /**
     * ........................*.........................
     * ........................^.........................
     * ........................1.........................
     */
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const flowField = ephemeral(bfsMonoFlowField([new RoomPosition(25, 25, 'W1N1')], costMatrix));
    const clockworkPath = ephemeral(flowField.pathToOrigin(new RoomPosition(0, 0, 'W1N1')));
    const path = clockworkPath.toArray();

    expect(path[0].isEqualTo(new RoomPosition(0, 0, 'W1N1'))).toBeTruthy();
    expect(path[path.length - 1].isEqualTo(new RoomPosition(25, 25, 'W1N1'))).toBeTruthy();
    expect(path.length).toBe(26);
  });
});
