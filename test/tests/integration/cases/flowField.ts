import { bfsDistanceMap, ClockworkCostMatrix, ephemeral, FlowField } from '../../../../src/index';
import { cpuTime } from '../../../utils/cpuTime';
// import { visualizeDistanceMap } from '../../../visualizations/helpers/visualizeDistanceMap';
import { describe, expect, it } from '../../helpers';
import { referenceBfsDistanceMap } from '../../referenceAlgorithms/bfsDistanceMap';
import { referenceFlowField, ReferenceFlowField } from '../../referenceAlgorithms/flowField';

describe('flowField', () => {
  it('should calculate the flow field for an empty room', () => {
    /**
     * ........................*.........................
     * ........................^.........................
     * ........................1.........................
     */
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const distanceMap = ephemeral(bfsDistanceMap([new RoomPosition(25, 25, 'W1N1')], costMatrix));
    const flowField = ephemeral(distanceMap.toFlowField());
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
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    for (let x = 11; x < 40; x++) {
      costMatrix.set(x, 25, 255);
    }
    const distanceMap = ephemeral(bfsDistanceMap([new RoomPosition(25, 26, 'W1N1')], costMatrix));
    const flowField = ephemeral(distanceMap.toFlowField());
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
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    for (let x = 10; x < 40; x++) {
      costMatrix.set(x, 25, 254);
    }
    const distanceMap = ephemeral(bfsDistanceMap([new RoomPosition(25, 26, 'W1N1')], costMatrix));
    const flowField = ephemeral(distanceMap.toFlowField());
    expect(flowField.getDirections(25, 26)).toEqual([]);
    expect(flowField.getDirections(25, 25)).toEqual([BOTTOM]);
    expect(flowField.getDirections(25, 24)).toEqual([BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT]);
  });
  it('should match the reference implementation', () => {
    let jsFlowField: ReferenceFlowField | undefined;
    const referenceDistanceMap = referenceBfsDistanceMap(
      [new RoomPosition(25, 26, 'W1N1')],
      new PathFinder.CostMatrix()
    );
    const referenceTime = cpuTime(() => {
      jsFlowField = referenceFlowField(referenceDistanceMap);
    });

    let clockworkFlowField: FlowField | undefined;
    const distanceMap = ephemeral(bfsDistanceMap([new RoomPosition(25, 26, 'W1N1')], new ClockworkCostMatrix()));
    const clockworkTime = cpuTime(() => {
      clockworkFlowField = ephemeral(distanceMap.toFlowField());
    });

    expect(clockworkFlowField?.getDirections(25, 26).sort()).toEqual(jsFlowField?.getDirections(25, 26).sort());
    expect(clockworkFlowField?.getDirections(25, 25).sort()).toEqual(jsFlowField?.getDirections(25, 25).sort());
    expect(clockworkFlowField?.getDirections(49, 49).sort()).toEqual(jsFlowField?.getDirections(49, 49).sort());

    console.log('referenceTime', referenceTime);
    console.log('clockworkTime', clockworkTime);
    expect(clockworkTime).toBeLessThan(referenceTime * 2);
  }, 50);
});
