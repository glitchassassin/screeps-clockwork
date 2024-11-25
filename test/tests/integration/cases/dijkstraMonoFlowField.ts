import { ClockworkCostMatrix, dijkstraMonoFlowField, MonoFlowField } from '../../../../src/index';
import { cpuTime } from '../../../utils/cpuTime';
import { describe, expect, it } from '../../helpers';
import {
  referenceDijkstraMonoFlowField,
  ReferenceMonoFlowField
} from '../../referenceAlgorithms/dijkstraMonoFlowField';
describe('dijkstraMonoFlowField', () => {
  it('should calculate the mono flow field for an empty room', () => {
    /**
     * ........................*.........................
     * ........................^.........................
     * ........................1.........................
     */
    const costMatrix = new ClockworkCostMatrix(1);
    const flowField = dijkstraMonoFlowField([new RoomPosition(25, 25, 'W1N1')], costMatrix);
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
    const costMatrix = new ClockworkCostMatrix(1);
    for (let x = 11; x < 40; x++) {
      costMatrix.set(x, 25, 255);
    }
    const flowField = dijkstraMonoFlowField([new RoomPosition(25, 26, 'W1N1')], costMatrix);
    expect(flowField.get(25, 26)).toBeUndefined();
    expect(flowField.get(24, 26)).toEqual(RIGHT);
    expect(flowField.get(25, 25)).toBeUndefined();
    expect([LEFT, TOP_LEFT]).toContain(flowField.get(24, 24));
    expect([RIGHT, TOP_RIGHT, LEFT, TOP_LEFT]).toContain(flowField.get(25, 24));
    expect([RIGHT, TOP_RIGHT]).toContain(flowField.get(26, 24));
  });
  it('should go through swamps when needed', () => {
    /**
     * ........................*.........................
     * ..........#############/^\##############..........
     * ........................1.........................
     */
    const costMatrix = new ClockworkCostMatrix(1);
    for (let x = 10; x < 40; x++) {
      costMatrix.set(x, 25, 5);
    }
    const flowField = dijkstraMonoFlowField([new RoomPosition(25, 26, 'W1N1')], costMatrix);
    expect(flowField.get(25, 26)).toBeUndefined();
    expect(flowField.get(25, 25)).toEqual(BOTTOM);
    expect(flowField.get(25, 24)).toEqual(BOTTOM);
  });
  it('should avoid swamps when there is a shorter path', () => {
    /**
     * ......................./-\........................
     * ..........############/###\#############..........
     * ........................1.........................
     */
    const costMatrix = new ClockworkCostMatrix(1);
    for (let x = 10; x < 40; x++) {
      if (x === 23 || x === 27) continue;
      costMatrix.set(x, 25, 5);
    }
    const flowField = dijkstraMonoFlowField([new RoomPosition(25, 26, 'W1N1')], costMatrix);
    expect(flowField.get(25, 26)).toBeUndefined();
    expect(flowField.get(25, 25)).toEqual(BOTTOM);
    expect([RIGHT, LEFT]).toContain(flowField.get(25, 24));
  });
  it('should match the reference implementation', () => {
    const costMatrix = new PathFinder.CostMatrix();
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        costMatrix.set(x, y, 1);
      }
    }
    let referenceFlowField: ReferenceMonoFlowField | undefined;
    const referenceTime = cpuTime(() => {
      referenceFlowField = referenceDijkstraMonoFlowField([new RoomPosition(25, 26, 'W1N1')], costMatrix.clone());
    });
    let clockworkFlowField: MonoFlowField | undefined;
    const clockworkTime = cpuTime(() => {
      clockworkFlowField = dijkstraMonoFlowField([new RoomPosition(25, 26, 'W1N1')], new ClockworkCostMatrix(1));
    });

    expect(clockworkFlowField?.get(25, 26)).toEqual(referenceFlowField?.get(25, 26));
    expect(clockworkFlowField?.get(25, 25)).toEqual(referenceFlowField?.get(25, 25));

    console.log('referenceTime', referenceTime);
    console.log('clockworkTime', clockworkTime);
    expect(clockworkTime).toBeLessThan(referenceTime * 2);
  }, 50);
});
