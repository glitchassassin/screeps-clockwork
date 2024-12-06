export function fromPacked(packedPos: number): RoomPosition {
  const pos = Object.create(RoomPosition.prototype);
  pos.__packedPos = packedPos;
  return pos;
}

export function fromPackedRoomName(packedRoomName: number): string {
  // Handle sim room case
  if (packedRoomName === 0) {
    return 'sim';
  }

  const HALF_WORLD_SIZE = 128;
  const x_coord = ((packedRoomName >> 8) & 0xff) - HALF_WORLD_SIZE;
  const y_coord = (packedRoomName & 0xff) - HALF_WORLD_SIZE;

  const result = (x_coord >= 0 ? `E${x_coord}` : `W${~x_coord}`) + (y_coord >= 0 ? `S${y_coord}` : `N${~y_coord}`);

  return result;
}

export function packRoomName(room: string): number {
  // Handle sim room case
  if (room === 'sim') {
    return 0;
  }

  const HALF_WORLD_SIZE = 128;
  const [, h_dir, h_coord, v_dir, v_coord] = room.match(/^([WE])(\d+)([NS])(\d+)$/)!;

  let x = parseInt(h_coord);
  if (h_dir === 'W') {
    x = ~x;
  }

  let y = parseInt(v_coord);
  if (v_dir === 'N') {
    y = ~y;
  }

  x += HALF_WORLD_SIZE;
  y += HALF_WORLD_SIZE;

  return (x << 8) | y;
}
