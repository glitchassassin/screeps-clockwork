import { bfsFlowField, ClockworkCostMatrix } from '../../../../src/index';
import { describe, expect, it } from '../../helpers';

describe('flowFieldPath', () => {
  it('should calculate a path from a flow field', () => {
    /**
     * ........................*.........................
     * ........................^.........................
     * ........................1.........................
     */
    const costMatrix = new ClockworkCostMatrix();
    const flowField = bfsFlowField([new RoomPosition(25, 25, 'W1N1')], costMatrix);
    const clockworkPath = flowField.pathToOrigin(new RoomPosition(0, 0, 'W1N1'));
    const path = clockworkPath.toArray();
    clockworkPath.free();
    flowField.free();

    expect(path[0].isEqualTo(new RoomPosition(0, 0, 'W1N1'))).toBeTruthy();
    expect(path[path.length - 1].isEqualTo(new RoomPosition(25, 25, 'W1N1'))).toBeTruthy();
    expect(path.length).toBe(26);
  });
});
