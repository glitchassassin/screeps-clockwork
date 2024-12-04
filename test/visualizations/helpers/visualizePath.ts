/**
 * Visualize a path.
 * @param room - The room to visualize the path in.
 * @param path - The path to visualize.
 */
export function visualizePath(path: RoomPosition[]) {
  // split the path into segments by room
  const segments: RoomPosition[][] = [];
  let currentSegment: RoomPosition[] = [];
  for (const pos of path) {
    if (currentSegment.length === 0 || currentSegment[currentSegment.length - 1].roomName === pos.roomName) {
      currentSegment.push(pos);
    } else {
      segments.push(currentSegment);
      currentSegment = [pos];
    }
  }
  segments.push(currentSegment);

  // render each segment
  for (const segment of segments) {
    const visual = Game.rooms[segment[0].roomName].visual;
    visual.poly(segment, { stroke: '#fff', fill: 'transparent', strokeWidth: 0.15 });
  }
}
