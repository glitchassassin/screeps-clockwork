/**
 * Visualize a path.
 * @param room - The room to visualize the path in.
 * @param path - The path to visualize.
 */
export function visualizePath(path: RoomPosition[], stroke: string = '#ffffff') {
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
    if (segment.length === 0) continue;
    Game.map.visual.poly(segment, { stroke, fill: 'transparent', strokeWidth: 1 });
    const visual = new RoomVisual(segment[0].roomName);
    visual.poly(segment, { stroke, fill: 'transparent', strokeWidth: 0.15 });
  }
}
