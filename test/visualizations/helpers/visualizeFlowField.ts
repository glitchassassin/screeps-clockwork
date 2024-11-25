import { FlowField } from '../../../src';

const DIRECTION_OFFSET = {
  [TOP]: { x: 0, y: -0.5 },
  [TOP_RIGHT]: { x: 0.5, y: -0.5 },
  [RIGHT]: { x: 0.5, y: 0 },
  [BOTTOM_RIGHT]: { x: 0.5, y: 0.5 },
  [BOTTOM]: { x: 0, y: 0.5 },
  [BOTTOM_LEFT]: { x: -0.5, y: 0.5 },
  [LEFT]: { x: -0.5, y: 0 },
  [TOP_LEFT]: { x: -0.5, y: -0.5 }
};

/**
 * Visualize a flow field.
 * @param room - The room to visualize.
 * @param flowField - The flow field to visualize.
 */
export function visualizeFlowField(room: string, flowField: FlowField) {
  const visual = Game.rooms[room].visual;
  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      const directions = flowField.getDirections(x, y) as DirectionConstant[];
      for (const direction of directions) {
        const offset = DIRECTION_OFFSET[direction];
        visual.line(x, y, x + offset.x, y + offset.y);
      }
    }
  }
}
