import { bfsDistanceMap, ClockworkCostMatrix, ephemeral, MonoFlowField } from '../../../../src/index';
import { cpuTime } from '../../../utils/cpuTime';
import { describe, expect, it } from '../../helpers';
import { referenceBfsDistanceMap } from '../../referenceAlgorithms/bfsDistanceMap';
import { referenceMonoFlowField, ReferenceMonoFlowField } from '../../referenceAlgorithms/monoFlowField';
describe('monoFlowField', () => {
  it('should calculate the mono flow field for an empty room', () => {
    /**
     * ........................*.........................
     * ........................^.........................
     * ........................1.........................
     */
    const costMatrix = ephemeral(new ClockworkCostMatrix());
    const distanceMap = ephemeral(bfsDistanceMap([new RoomPosition(25, 25, 'W1N1')], costMatrix));
    const flowField = ephemeral(distanceMap.toMonoFlowField());
    expect(flowField.get(25, 25)).toBeUndefined();
    expect(flowField.get(26, 25)).toEqual(LEFT);
    expect(flowField.get(1, 1)).toEqual(BOTTOM_RIGHT);
  });
  it('should calculate the mono flow field with terrain obstacles', () => {
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
    const flowField = ephemeral(distanceMap.toMonoFlowField());
    expect(flowField.get(25, 26)).toBeUndefined();
    expect(flowField.get(24, 26)).toEqual(RIGHT);
    expect(flowField.get(25, 25)).toBeUndefined();
    expect(flowField.get(25, 24)).toEqual(TOP_RIGHT);
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
    const flowField = ephemeral(distanceMap.toMonoFlowField());
    expect(flowField.get(25, 26)).toBeUndefined();
    expect(flowField.get(25, 25)).toEqual(BOTTOM);
    expect(flowField.get(25, 24)).toEqual(BOTTOM_RIGHT);
  });
  it('should match the reference implementation', () => {
    let referenceFlowField: ReferenceMonoFlowField | undefined;
    const referenceDistanceMap = referenceBfsDistanceMap(
      [new RoomPosition(25, 26, 'W1N1')],
      new PathFinder.CostMatrix()
    );
    const referenceTime = cpuTime(() => {
      referenceFlowField = referenceMonoFlowField(referenceDistanceMap);
    });
    let clockworkFlowField: MonoFlowField | undefined;
    const clockworkDistanceMap = ephemeral(
      bfsDistanceMap([new RoomPosition(25, 26, 'W1N1')], new ClockworkCostMatrix())
    );
    const clockworkTime = cpuTime(() => {
      clockworkFlowField = ephemeral(clockworkDistanceMap.toMonoFlowField());
    });

    expect(clockworkFlowField?.get(25, 26)).toEqual(referenceFlowField?.get(25, 26));
    expect(clockworkFlowField?.get(25, 25)).toEqual(referenceFlowField?.get(25, 25));
    expect(clockworkFlowField?.get(49, 49)).toEqual(referenceFlowField?.get(49, 49));

    console.log('referenceTime', referenceTime);
    console.log('clockworkTime', clockworkTime);
    expect(clockworkTime).toBeLessThan(referenceTime * 2);
  }, 50);
});
