import { ClockworkCostMatrix } from '../../../../src/index';
import { cpuTime } from '../../../utils/cpuTime';
import { describe, expect, it } from '../../helpers';

describe('clockworkCostMatrix', () => {
  it('should work', () => {
    const matrix = new ClockworkCostMatrix();
    matrix.set(0, 0, 1);
    expect(matrix.get(0, 0)).toBe(1);
    matrix.free();
  });
  it('should not be significantly slower than screeps', () => {
    const clockwork_matrix = new ClockworkCostMatrix();
    const screeps_matrix = new PathFinder.CostMatrix();
    const clockworkSetTime = cpuTime(() => {
      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          clockwork_matrix.set(x, y, 1);
        }
      }
    });
    const clockworkGetTime = cpuTime(() => {
      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          clockwork_matrix.get(x, y);
        }
      }
    });

    clockwork_matrix.free();

    const screepsSetTime = cpuTime(() => {
      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          screeps_matrix.set(x, y, 1);
        }
      }
    });
    const screepsGetTime = cpuTime(() => {
      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          screeps_matrix.get(x, y);
        }
      }
    });
    console.log('clockworkSetTime', clockworkSetTime);
    console.log('screepsSetTime', screepsSetTime);
    console.log('clockworkGetTime', clockworkGetTime);
    console.log('screepsGetTime', screepsGetTime);
    expect(clockworkSetTime + clockworkGetTime).toBeLessThan((screepsSetTime + screepsGetTime) * 2);
  });
});
