import { bfsMultiroomDistanceMap, ClockworkCostMatrix, ephemeral } from '../../../../src/index';
import { describe, expect, it } from '../../helpers';

describe('multiroomFlowFieldPath', () => {
  it('should calculate a path from a multiroom flow field', () => {
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(
      bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
        costMatrixCallback(room) {
          if (['W1N1', 'W1N2', 'W2N2'].includes(room)) {
            return costMatrix;
          }
          return undefined;
        },
        maxRooms: 3
      })
    );
    const flowField = ephemeral(distanceMap.toFlowField());
    const clockworkPath = ephemeral(flowField.pathToOrigin(new RoomPosition(25, 25, 'W2N2')));
    const path = clockworkPath.toArray();

    expect(path[0].isEqualTo(new RoomPosition(25, 25, 'W1N1'))).toBeTruthy();
    expect(path[path.length - 1].isEqualTo(new RoomPosition(25, 25, 'W2N2'))).toBeTruthy();
    expect(path.length).toBe(53);
  }, 15);
});
