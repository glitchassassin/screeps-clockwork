import { ClockworkCostMatrix, dijkstraFlowField, FlowField } from '../../../../src/index';
import { cpuTime } from '../../../utils/cpuTime';
import { describe, expect, it } from '../../helpers';
import { referenceDijkstraFlowField, ReferenceFlowField } from '../../referenceAlgorithms/dijkstraFlowField';

describe('dijkstraFlowField', () => {
  it('should calculate the flow field for an empty room', () => {
    /**
     * ........................*.........................
     * ........................^.........................
     * ........................1.........................
     */
    const costMatrix = new ClockworkCostMatrix(1);
    const flowField = dijkstraFlowField([new RoomPosition(25, 25, 'W1N1')], costMatrix);
    expect(flowField.getDirections(25, 25)).toEqual([]);
    expect(flowField.getDirections(26, 25)).toEqual([LEFT]);
    expect(flowField.getDirections(0, 0)).toEqual([BOTTOM_RIGHT]);
  });
  it('should calculate the flow field with terrain obstacles', () => {
    /**
     * ........../<<<<<<<<<<<<<1>>>>>>>>>>>>>>\..........
     * .........\##############################/.........
     * ..........>>>>>>>>>>>>>>*<<<<<<<<<<<<<<<..........
     */
    const costMatrix = new ClockworkCostMatrix(1);
    for (let x = 11; x < 40; x++) {
      costMatrix.set(x, 25, 255);
    }
    const flowField = dijkstraFlowField([new RoomPosition(25, 26, 'W1N1')], costMatrix);
    expect(flowField.getDirections(25, 26)).toEqual([]);
    expect(flowField.getDirections(24, 26)).toEqual([RIGHT]);
    expect(flowField.getDirections(25, 25)).toEqual([]);
    expect(flowField.getDirections(25, 24)).toEqual([TOP_RIGHT, RIGHT, LEFT, TOP_LEFT]);
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
    const flowField = dijkstraFlowField([new RoomPosition(25, 26, 'W1N1')], costMatrix);
    expect(flowField.getDirections(25, 26)).toEqual([]);
    expect(flowField.getDirections(25, 25)).toEqual([BOTTOM]);
    expect(flowField.getDirections(25, 24)).toEqual([BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT]);
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
    const flowField = dijkstraFlowField([new RoomPosition(25, 26, 'W1N1')], costMatrix);
    expect(flowField.getDirections(25, 26)).toEqual([]);
    expect(flowField.getDirections(25, 25)).toEqual([BOTTOM]);
    expect(flowField.getDirections(25, 24)).toEqual([RIGHT, LEFT]);
  });
  it('should match the reference implementation', () => {
    const costMatrix = new PathFinder.CostMatrix();
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        costMatrix.set(x, y, 1);
      }
    }
    let referenceFlowField: ReferenceFlowField | undefined;
    const referenceTime = cpuTime(() => {
      referenceFlowField = referenceDijkstraFlowField([new RoomPosition(25, 26, 'W1N1')], costMatrix.clone());
    });
    let clockworkFlowField: FlowField | undefined;
    const clockworkTime = cpuTime(() => {
      clockworkFlowField = dijkstraFlowField([new RoomPosition(25, 26, 'W1N1')], new ClockworkCostMatrix(1));
    });

    expect(clockworkFlowField?.getDirections(25, 26).sort()).toEqual(referenceFlowField?.getDirections(25, 26).sort());
    expect(clockworkFlowField?.getDirections(25, 25).sort()).toEqual(referenceFlowField?.getDirections(25, 25).sort());
    expect(clockworkFlowField?.getDirections(49, 49).sort()).toEqual(referenceFlowField?.getDirections(49, 49).sort());

    console.log('referenceTime', referenceTime);
    console.log('clockworkTime', clockworkTime);
    expect(clockworkTime).toBeLessThan(referenceTime * 2);
  }, 50);
});
