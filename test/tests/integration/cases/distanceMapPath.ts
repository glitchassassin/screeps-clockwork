import { bfsDistanceMap, ClockworkCostMatrix, pathToDistanceMapOrigin } from '../../../../src/index';
import { describe, expect, it } from '../../helpers';

describe('distanceMapPath', () => {
  it('should calculate a path from a distance map', () => {
    /**
     * ........................*.........................
     * ........................^.........................
     * ........................1.........................
     */
    const costMatrix = new ClockworkCostMatrix();
    const distanceMap = bfsDistanceMap([new RoomPosition(25, 25, 'W1N1')], costMatrix);
    const clockworkPath = pathToDistanceMapOrigin(new RoomPosition(0, 0, 'W1N1'), distanceMap);
    const path = clockworkPath.toArray();
    clockworkPath.free();
    distanceMap.free();

    expect(path[0].isEqualTo(new RoomPosition(0, 0, 'W1N1'))).toBeTruthy();
    expect(path[path.length - 1].isEqualTo(new RoomPosition(25, 25, 'W1N1'))).toBeTruthy();
    expect(path.length).toBe(26);
  });
});
