import { bfsMultiroomDistanceMap, ClockworkCostMatrix, ephemeral } from '../../../../src/index';
import { describe, expect, it } from '../../helpers';

describe('multiroomDistanceMapPath', () => {
  it('should calculate a path from a multiroom distance map', () => {
    /**
     * ........................*.........................
     * ........................^.........................
     * ........................1.........................
     */
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback(room) {
          if (['W1N1', 'W1N2'].includes(room)) {
            return costMatrix;
          }
          return undefined;
        },
        maxRooms: 2
      })
    );
    const clockworkPath = ephemeral(distanceMap.pathToOrigin(new RoomPosition(25, 25, 'W1N2')));
    const path = clockworkPath.toArray();

    expect(path[0].isEqualTo(new RoomPosition(25, 25, 'W1N2'))).toBeTruthy();
    expect(path[path.length - 1].isEqualTo(new RoomPosition(25, 25, 'W1N1'))).toBeTruthy();
    expect(path.length).toBe(51);
  }, 15);
});
