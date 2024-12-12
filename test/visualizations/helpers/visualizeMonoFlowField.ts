import { ClockworkMonoFlowField } from '../../../src';

const DIRECTION_ARROWS = {
  [TOP]: '↑',
  [TOP_RIGHT]: '↗',
  [RIGHT]: '→',
  [BOTTOM_RIGHT]: '↘',
  [BOTTOM]: '↓',
  [BOTTOM_LEFT]: '↙',
  [LEFT]: '←',
  [TOP_LEFT]: '↖'
};

/**
 * Visualize a mono-directional flow field.
 * @param room - The room to visualize.
 * @param flowField - The flow field to visualize.
 */
export function visualizeMonoFlowField(room: string, flowField: ClockworkMonoFlowField) {
  const visual = new RoomVisual(room);
  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      const direction = flowField.get(x, y);
      if (direction) {
        visual.text(DIRECTION_ARROWS[direction], x, y);
      }
    }
  }
}
