import { bfsMultiroomDistanceMap, ClockworkCostMatrix, DirectionOrder } from '../../../../src/index';
import { describe, expect, it } from '../../helpers';

describe('multiroomDistanceMapPath', () => {
  it('should calculate a path from a multiroom distance map', () => {
    /**
     * ........................*.........................
     * ........................^.........................
     * ........................1.........................
     */
    const costMatrix = new ClockworkCostMatrix(1);
    const distanceMap = bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
      costMatrixCallback(room) {
        if (['W1N1', 'W1N2'].includes(room)) {
          return costMatrix;
        }
        return undefined;
      },
      maxRooms: 2
    }).distanceMap;
    const clockworkPath = distanceMap.pathToOrigin(new RoomPosition(25, 25, 'W1N2'));
    const path = clockworkPath.toArrayReversed();

    expect(path[0].isEqualTo(new RoomPosition(25, 25, 'W1N1'))).toBeTruthy();
    expect(path[path.length - 1].isEqualTo(new RoomPosition(25, 25, 'W1N2'))).toBeTruthy();
    expect(path.length).toBe(51);
  }, 15);

  it('should prefer diagonal steps when requested', () => {
    const costMatrix = new ClockworkCostMatrix(1);
    const distanceMap = bfsMultiroomDistanceMap([new RoomPosition(25, 25, 'W1N1')], {
      costMatrixCallback: () => costMatrix,
      maxRooms: 1
    }).distanceMap;

    const defaultPath = distanceMap.pathToOrigin(new RoomPosition(27, 26, 'W1N1'));
    const defaultPositions = defaultPath.toArray();
    expect(defaultPositions[1].isEqualTo(new RoomPosition(26, 26, 'W1N1'))).toBeTruthy();

    const diagonalPath = distanceMap.pathToOrigin(new RoomPosition(27, 26, 'W1N1'), {
      directionOrder: DirectionOrder.DiagonalFirst
    });
    const diagonalPositions = diagonalPath.toArray();
    expect(diagonalPositions[1].isEqualTo(new RoomPosition(26, 25, 'W1N1'))).toBeTruthy();
  });
});
