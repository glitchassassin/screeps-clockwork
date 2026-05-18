import { ClockworkCostMatrix, getTerrainCostMatrix } from '../../../../src/index';
import { cpuTime, formatCpuTime } from '../../../utils/cpuTime';
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
    const clockworkSetTime = cpuTime(
      () => {
        for (let x = 0; x < 50; x++) {
          for (let y = 0; y < 50; y++) {
            clockwork_matrix.set(x, y, 1);
          }
        }
      },
      { iterations: 1 }
    );
    const clockworkGetTime = cpuTime(
      () => {
        for (let x = 0; x < 50; x++) {
          for (let y = 0; y < 50; y++) {
            clockwork_matrix.get(x, y);
          }
        }
      },
      { iterations: 1 }
    );

    const screepsSetTime = cpuTime(
      () => {
        for (let x = 0; x < 50; x++) {
          for (let y = 0; y < 50; y++) {
            screeps_matrix.set(x, y, 1);
          }
        }
      },
      { iterations: 1 }
    );
    const screepsGetTime = cpuTime(
      () => {
        for (let x = 0; x < 50; x++) {
          for (let y = 0; y < 50; y++) {
            screeps_matrix.get(x, y);
          }
        }
      },
      { iterations: 1 }
    );
    console.logUnsafe('clockworkSetTime', formatCpuTime(clockworkSetTime));
    console.logUnsafe('screepsSetTime', formatCpuTime(screepsSetTime));
    console.logUnsafe('clockworkGetTime', formatCpuTime(clockworkGetTime));
    console.logUnsafe('screepsGetTime', formatCpuTime(screepsGetTime));
    expect(clockworkSetTime.mean + clockworkGetTime.mean).toBeLessThan((screepsSetTime.mean + screepsGetTime.mean) * 2);
  });
  it('should fill terrain data faster than screeps', () => {
    const clockworkTime = cpuTime(
      () => {
        getTerrainCostMatrix('W1N1', { plainCost: 1, swampCost: 5, wallCost: 255 });
      },
      { iterations: 10 }
    );
    const screepsTime = cpuTime(
      () => {
        referenceGetTerrainCostMatrix('W1N1', { plainCost: 1, swampCost: 5, wallCost: 255 });
      },
      { iterations: 10 }
    );
    console.logUnsafe('clockworkTime', formatCpuTime(clockworkTime));
    console.logUnsafe('screepsTime', formatCpuTime(screepsTime));
    expect(clockworkTime.mean).toBeLessThan(screepsTime.mean);
  }, 20);
});
