import { bfsMonoFlowField, ClockworkCostMatrix, MonoFlowField } from '../../../../src/index';
import { cpuTime } from '../../../utils/cpuTime';
import { describe, expect, it } from '../../helpers';
import { referenceBfsMonoFlowField, ReferenceMonoFlowField } from '../../referenceAlgorithms/bfsMonoFlowField';

describe('bfsMonoFlowField', () => {
  it('should calculate the mono flow field for an empty room', () => {
    /**
     * ........................*.........................
     * ........................^.........................
     * ........................1.........................
     */
    const costMatrix = new ClockworkCostMatrix();
    const flowField = bfsMonoFlowField([new RoomPosition(25, 25, 'W1N1')], costMatrix);
    expect(flowField.get(25, 25)).toBeUndefined();
    expect(flowField.get(26, 25)).toEqual(LEFT);
    expect(flowField.get(0, 0)).toEqual(BOTTOM_RIGHT);
  });
  it('should calculate the mono flow field with terrain obstacles', () => {
    /**
     * ........../<<<<<<<<<<<<<1>>>>>>>>>>>>>>\..........
     * .........\##############################/.........
     * ..........>>>>>>>>>>>>>>*<<<<<<<<<<<<<<<..........
     */
    const costMatrix = new ClockworkCostMatrix();
    for (let x = 11; x < 40; x++) {
      costMatrix.set(x, 25, 255);
    }
    const flowField = bfsMonoFlowField([new RoomPosition(25, 26, 'W1N1')], costMatrix);
    expect(flowField.get(25, 26)).toBeUndefined();
    expect(flowField.get(24, 26)).toEqual(RIGHT);
    expect(flowField.get(25, 25)).toBeUndefined();
    expect(flowField.get(25, 24)).toEqual(RIGHT);
  });
  it('should ignore non-blocking terrain values', () => {
    /**
     * ........................*.........................
     * ..........#############/^\##############..........
     * ........................1.........................
     */
    const costMatrix = new ClockworkCostMatrix();
    for (let x = 10; x < 40; x++) {
      costMatrix.set(x, 25, 254);
    }
    const flowField = bfsMonoFlowField([new RoomPosition(25, 26, 'W1N1')], costMatrix);
    expect(flowField.get(25, 26)).toBeUndefined();
    expect(flowField.get(25, 25)).toEqual(BOTTOM);
    expect(flowField.get(25, 24)).toEqual(BOTTOM);
  });
  it('should match the reference implementation', () => {
    let referenceFlowField: ReferenceMonoFlowField | undefined;
    const referenceTime = cpuTime(() => {
      referenceFlowField = referenceBfsMonoFlowField([new RoomPosition(25, 26, 'W1N1')], new PathFinder.CostMatrix());
    });
    let clockworkFlowField: MonoFlowField | undefined;
    const clockworkTime = cpuTime(() => {
      clockworkFlowField = bfsMonoFlowField([new RoomPosition(25, 26, 'W1N1')], new ClockworkCostMatrix());
    });

    expect(clockworkFlowField?.get(25, 26)).toEqual(referenceFlowField?.get(25, 26));
    expect(clockworkFlowField?.get(25, 25)).toEqual(referenceFlowField?.get(25, 25));
    expect(clockworkFlowField?.get(49, 49)).toEqual(referenceFlowField?.get(49, 49));

    console.log('referenceTime', referenceTime);
    console.log('clockworkTime', clockworkTime);
    expect(clockworkTime).toBeLessThan(referenceTime * 2);
  }, 50);
});
