import { getRange } from '../../../../src/index';
import { cpuTime } from '../../../utils/cpuTime';
import { describe, expect, it } from '../../helpers';
import { referenceGetRange } from '../../referenceAlgorithms/getRange';

describe('getRange', () => {
  it('should calculate the distance within a room', () => {
    const distance = getRange(new RoomPosition(25, 25, 'W1N1'), new RoomPosition(26, 25, 'W1N1'));
    expect(distance).toBe(1);
  });
  it('should calculate the distance between multiple rooms', () => {
    const distance = getRange(new RoomPosition(25, 25, 'W1N1'), new RoomPosition(25, 25, 'W2N1'));
    expect(distance).toBe(50);
  });
  it('should match the reference implementation', () => {
    let referenceDistance: number | undefined;
    const from = new RoomPosition(25, 26, 'W1N1');
    const to = new RoomPosition(25, 26, 'W2N1');
    const referenceTime = cpuTime(() => {
      referenceDistance = referenceGetRange(from, to);
    }, 1000);
    let clockworkDistance: number | undefined;
    const clockworkTime = cpuTime(() => {
      clockworkDistance = getRange(from, to);
    }, 1000);
    expect(clockworkDistance).toEqual(referenceDistance);

    console.log('referenceTime (1000 iterations)', referenceTime);
    console.log('clockworkTime (1000 iterations)', clockworkTime);
    expect(clockworkTime).toBeLessThan(referenceTime * 2);
  }, 20);
  it('should match the Screeps baseline', () => {
    let referenceDistance: number | undefined;
    const from = new RoomPosition(0, 0, 'W1N1');
    const to = new RoomPosition(49, 49, 'W1N1');
    const referenceTime = cpuTime(() => {
      referenceDistance = from.getRangeTo(to);
    }, 1000);
    let clockworkDistance: number | undefined;
    const clockworkTime = cpuTime(() => {
      clockworkDistance = getRange(from, to);
    }, 1000);
    expect(clockworkDistance).toEqual(referenceDistance);

    console.log('referenceTime (1000 iterations)', referenceTime);
    console.log('clockworkTime (1000 iterations)', clockworkTime);
    expect(clockworkTime).toBeLessThan(referenceTime * 2);
  }, 20);
});
