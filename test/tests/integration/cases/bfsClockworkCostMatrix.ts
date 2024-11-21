import { ClockworkCostMatrix } from '../../../../src/index';
import { cpuTime } from '../../../utils/cpuTime';
import { describe, expect, it } from '../../helpers';

describe('bfsClockworkCostMatrix', () => {
  it('should work', () => {
    const matrix = new ClockworkCostMatrix();
    matrix.set(0, 0, 1);
    expect(matrix.get(0, 0)).toBe(1);
    matrix.free();
  });
  it('should not be significantly slower than screeps', () => {
    const clockwork_matrix = new ClockworkCostMatrix();
    const screeps_matrix = new PathFinder.CostMatrix();
    const clockwork_time = cpuTime(() => {
      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          clockwork_matrix.set(x, y, 1);
          clockwork_matrix.get(x, y);
        }
      }
    });
    const screeps_time = cpuTime(() => {
      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          screeps_matrix.set(x, y, 1);
          screeps_matrix.get(x, y);
        }
      }
    });
    console.log('clockwork_time', clockwork_time);
    console.log('screeps_time', screeps_time);
    expect(clockwork_time).toBeLessThan(screeps_time * 2);
  });
});
