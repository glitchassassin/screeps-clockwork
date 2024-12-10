import { bfsMonoFlowField, ClockworkCostMatrix } from '../../../../src/index';
import { describe, expect, it } from '../../helpers';

describe('monoFlowFieldPath', () => {
  it('should calculate a path from a mono flow field', () => {
    /**
     * ........................*.........................
     * ........................^.........................
     * ........................1.........................
     */
    const costMatrix = new ClockworkCostMatrix();
    const flowField = bfsMonoFlowField([new RoomPosition(25, 25, 'W1N1')], costMatrix);
    const clockworkPath = flowField.pathToOrigin(new RoomPosition(0, 0, 'W1N1'));
    const path = clockworkPath.toArray();
    clockworkPath.free();
    flowField.free();

    expect(path[0].isEqualTo(new RoomPosition(0, 0, 'W1N1'))).toBeTruthy();
    expect(path[path.length - 1].isEqualTo(new RoomPosition(25, 25, 'W1N1'))).toBeTruthy();
    expect(path.length).toBe(26);
  });
});
