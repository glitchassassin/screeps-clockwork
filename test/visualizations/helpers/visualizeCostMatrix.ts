import { ClockworkCostMatrix } from '../../../src';

const UNREACHABLE = 0xff;

/**
 * Visualize a distance map.
 * @param room - The room to visualize.
 * @param distanceMap - The distance map to visualize.
 */
export function visualizeCostMatrix(room: string, costMatrix: ClockworkCostMatrix) {
  const viz = new RoomVisual(room);
  for (let y = 0; y < 50; y++) {
    for (let x = 0; x < 50; x++) {
      const cost = costMatrix.get(x, y);
      if (cost !== 0) {
        viz.text(`${cost}`, x, y);
      }
    }
  }
}
