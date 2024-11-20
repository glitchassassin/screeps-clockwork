import { bfsDistanceMap, ClockworkCostMatrix } from 'screeps-clockwork';
import { DistanceMap } from 'screeps-clockwork/wasm';
import { describe, expect, it } from 'tests/helpers';
import { referenceBfsDistanceMap, ReferenceDistanceMap } from 'tests/referenceAlgorithms/bfsDistanceMap';
import { cpuTime } from 'utils/cpuTime';

describe('bfsDistanceMap', () => {
  it('should calculate the distance map for an empty room', () => {
    /**
     * ........................*.........................
     * ........................|.........................
     * ........................1.........................
     */
    const costMatrix = new ClockworkCostMatrix();
    const distanceMap = bfsDistanceMap([new RoomPosition(25, 25, 'W1N1')], costMatrix);
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
    const costMatrix = new ClockworkCostMatrix();
    for (let x = 10; x < 40; x++) {
      costMatrix.set(x, 25, 255);
    }
    const distanceMap = bfsDistanceMap([new RoomPosition(25, 26, 'W1N1')], costMatrix);
    expect(distanceMap.get(25, 26)).toBe(0);
    expect(distanceMap.get(26, 26)).toBe(1);
    expect(distanceMap.get(25, 25)).toBe(0xffffffff);
    expect(distanceMap.get(25, 24)).toBe(30);
  });
  it('should ignore non-blocking terrain values', () => {
    /**
     * ...............*..................*...............
     * ..........#####|##################|#####..........
     * ...............1..................2...............
     */
    const costMatrix = new ClockworkCostMatrix();
    for (let x = 10; x < 40; x++) {
      costMatrix.set(x, 25, 254);
    }
    const distanceMap = bfsDistanceMap([new RoomPosition(25, 26, 'W1N1')], costMatrix);
    expect(distanceMap.get(25, 26)).toBe(0);
    expect(distanceMap.get(26, 26)).toBe(1);
    expect(distanceMap.get(25, 25)).toBe(1);
    expect(distanceMap.get(25, 24)).toBe(2);
  });
  it('should calculate the distance map with multiple sources', () => {
    /**
     * ..........-----*...................*----..........
     * .........|##############################|.........
     * ..........-----1...................2----..........
     */
    const costMatrix = new ClockworkCostMatrix();
    for (let x = 10; x < 40; x++) {
      costMatrix.set(x, 25, 255);
    }
    const distanceMap = bfsDistanceMap(
      [new RoomPosition(15, 26, 'W1N1'), new RoomPosition(35, 26, 'W1N1')],
      costMatrix
    );
    expect(distanceMap.get(15, 26)).toBe(0);
    expect(distanceMap.get(15, 24)).toBe(12);
    expect(distanceMap.get(35, 26)).toBe(0);
    expect(distanceMap.get(35, 24)).toBe(10);
  });
  it('should match the reference implementation', () => {
    let referenceDistanceMap: ReferenceDistanceMap | undefined;
    const referenceTime = cpuTime(() => {
      referenceDistanceMap = referenceBfsDistanceMap([new RoomPosition(25, 26, 'W1N1')], new PathFinder.CostMatrix());
    });
    let clockworkDistanceMap: DistanceMap | undefined;
    const clockworkTime = cpuTime(() => {
      clockworkDistanceMap = bfsDistanceMap([new RoomPosition(25, 26, 'W1N1')], new ClockworkCostMatrix());
    });
    expect(clockworkDistanceMap?.get(0, 0)).toEqual(referenceDistanceMap?.get(0, 0));
    expect(clockworkDistanceMap?.get(25, 26)).toEqual(referenceDistanceMap?.get(25, 26));
    expect(clockworkDistanceMap?.get(49, 49)).toEqual(referenceDistanceMap?.get(49, 49));

    console.log('referenceTime', referenceTime);
    console.log('clockworkTime', clockworkTime);
    expect(clockworkTime).toBeLessThan(referenceTime * 2);
  }, 20);
});
