import { bfsFlowField, ClockworkCostMatrix } from 'screeps-clockwork';
import { describe, expect, it } from 'tests/helpers';

describe('bfsFlowField', () => {
  it('should calculate the flow field for an empty room', () => {
    /**
     * ........................*.........................
     * ........................^.........................
     * ........................1.........................
     */
    const costMatrix = new ClockworkCostMatrix();
    const flowField = bfsFlowField([new RoomPosition(25, 25, 'W1N1')], costMatrix);
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
    const costMatrix = new ClockworkCostMatrix();
    for (let x = 11; x < 40; x++) {
      costMatrix.set(x, 25, 255);
    }
    const flowField = bfsFlowField([new RoomPosition(25, 26, 'W1N1')], costMatrix);
    expect(flowField.getDirections(25, 26)).toEqual([]);
    expect(flowField.getDirections(24, 26)).toEqual([RIGHT]);
    expect(flowField.getDirections(25, 25)).toEqual([]);
    expect(flowField.getDirections(25, 24)).toEqual([TOP_RIGHT, RIGHT, LEFT, TOP_LEFT]);
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
    const flowField = bfsFlowField([new RoomPosition(25, 26, 'W1N1')], costMatrix);
    expect(flowField.getDirections(25, 26)).toEqual([]);
    expect(flowField.getDirections(25, 25)).toEqual([BOTTOM]);
    expect(flowField.getDirections(25, 24)).toEqual([BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT]);
  });
});
