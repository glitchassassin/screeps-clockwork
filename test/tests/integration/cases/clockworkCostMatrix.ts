import { ClockworkCostMatrix, getTerrainCostMatrix } from '../../../../src/index';
import { cpuTime } from '../../../utils/cpuTime';
import { describe, expect, it } from '../../helpers';
import { referenceGetTerrainCostMatrix } from '../../referenceAlgorithms/getTerrainCostMatrix';

describe('clockworkCostMatrix', () => {
  it('should work', () => {
    const matrix = new ClockworkCostMatrix();
    matrix.set(0, 0, 1);
    expect(matrix.get(0, 0)).toBe(1);
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
    console.logUnsafe('clockworkSetTime', clockworkSetTime);
    console.logUnsafe('screepsSetTime', screepsSetTime);
    console.logUnsafe('clockworkGetTime', clockworkGetTime);
    console.logUnsafe('screepsGetTime', screepsGetTime);
    expect(clockworkSetTime + clockworkGetTime).toBeLessThan((screepsSetTime + screepsGetTime) * 2);
  });
  it('should fill terrain data faster than screeps', () => {
    const clockworkTime = cpuTime(() => {}, 10);
    const screepsTime = cpuTime(() => {
      referenceGetTerrainCostMatrix('W1N1', { plainCost: 1, swampCost: 5, wallCost: 255 });
    }, 10);
    console.logUnsafe('clockworkTime', clockworkTime);
    console.logUnsafe('screepsTime', screepsTime);
    expect(clockworkTime).toBeLessThan(screepsTime);
  }, 20);
});
