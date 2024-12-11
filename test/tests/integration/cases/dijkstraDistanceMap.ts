import { ClockworkCostMatrix, dijkstraDistanceMap, DistanceMap, ephemeral } from '../../../../src/index';
import { cpuTime } from '../../../utils/cpuTime';
import { describe, expect, it } from '../../helpers';
import { referenceDijkstraDistanceMap, ReferenceDistanceMap } from '../../referenceAlgorithms/dijkstraDistanceMap';

describe('dijkstraDistanceMap', () => {
  it('should calculate the distance map for an empty room', () => {
    /**
     * ........................*.........................
     * ........................|.........................
     * ........................1.........................
     */
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    const distanceMap = ephemeral(dijkstraDistanceMap([new RoomPosition(25, 25, 'W1N1')], costMatrix));
    expect(distanceMap.get(25, 25)).toBe(0);
    expect(distanceMap.get(26, 25)).toBe(1);
    expect(distanceMap.get(0, 0)).toBe(25);
  });
  it('should calculate the distance map with terrain obstacles', () => {
    /**
     * ..........--------------*.........................
     * .........|##############################..........
     * ..........--------------1.........................
     */
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    for (let x = 10; x < 40; x++) {
      costMatrix.set(x, 25, 255);
    }
    const distanceMap = ephemeral(dijkstraDistanceMap([new RoomPosition(25, 26, 'W1N1')], costMatrix));
    expect(distanceMap.get(25, 26)).toBe(0);
    expect(distanceMap.get(26, 26)).toBe(1);
    expect(distanceMap.get(25, 25)).toBe(0xffffffff);
    expect(distanceMap.get(25, 24)).toBe(30);
  });
  it('should include non-blocking terrain values', () => {
    /**
     * ........................*.........................
     * ..........##############|###############..........
     * ........................1.........................
     */
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    for (let x = 10; x < 40; x++) {
      costMatrix.set(x, 25, 5);
    }
    const distanceMap = ephemeral(dijkstraDistanceMap([new RoomPosition(25, 26, 'W1N1')], costMatrix));
    expect(distanceMap.get(25, 26)).toBe(0);
    expect(distanceMap.get(26, 26)).toBe(1);
    expect(distanceMap.get(25, 25)).toBe(5);
    expect(distanceMap.get(25, 24)).toBe(6);
  });
  it('should calculate the distance map with multiple sources', () => {
    /**
     * ..........-----*...................*----..........
     * .........|##############################|.........
     * ..........-----1...................2----..........
     */
    const costMatrix = ephemeral(new ClockworkCostMatrix(1));
    for (let x = 10; x < 40; x++) {
      costMatrix.set(x, 25, 255);
    }
    const distanceMap = ephemeral(
      dijkstraDistanceMap([new RoomPosition(15, 26, 'W1N1'), new RoomPosition(35, 26, 'W1N1')], costMatrix)
    );
    expect(distanceMap.get(15, 26)).toBe(0);
    expect(distanceMap.get(15, 24)).toBe(12);
    expect(distanceMap.get(35, 26)).toBe(0);
    expect(distanceMap.get(35, 24)).toBe(10);
  });
  it('should match the reference implementation', () => {
    let referenceDistanceMap: ReferenceDistanceMap | undefined;
    const costMatrix = new PathFinder.CostMatrix();
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        costMatrix.set(x, y, 1);
      }
    }

    const referenceTime = cpuTime(() => {
      referenceDistanceMap = referenceDijkstraDistanceMap([new RoomPosition(25, 26, 'W1N1')], costMatrix.clone());
    });
    let clockworkDistanceMap: DistanceMap | undefined;
    const clockworkTime = cpuTime(() => {
      clockworkDistanceMap = ephemeral(
        dijkstraDistanceMap([new RoomPosition(25, 26, 'W1N1')], ephemeral(new ClockworkCostMatrix(1)))
      );
    });
    expect(clockworkDistanceMap?.get(0, 0)).toEqual(referenceDistanceMap?.get(0, 0));
    expect(clockworkDistanceMap?.get(25, 26)).toEqual(referenceDistanceMap?.get(25, 26));
    expect(clockworkDistanceMap?.get(49, 49)).toEqual(referenceDistanceMap?.get(49, 49));

    console.log('referenceTime', referenceTime);
    console.log('clockworkTime', clockworkTime);
    expect(clockworkTime).toBeLessThan(referenceTime * 2);
  }, 20);
});
