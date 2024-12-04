export function fromPacked(packedPos: number): RoomPosition {
  const pos = Object.create(RoomPosition.prototype);
  pos.__packedPos = packedPos;
  return pos;
}
