import { bench, describe } from 'vitest';

import { fromPackedRoomName, fromPackedRoomNameCached } from '../../src/utils/fromPacked';
import { packDestinations, packPositions } from '../../src/utils/packedArrays';

const HALF_WORLD_SIZE = 128;
const rooms = ['W1N1', 'W1N2', 'W2N1', 'W2N2', 'W3N3', 'W4N4', 'W5N5', 'W6N6', 'W7N7'].map(packRoomName);
const roomLookup = new Map(rooms.map(room => [fromPackedRoomName(room), room]));
const starts = Array.from(
  { length: 8 },
  (_, i) => ({ __packedPos: packPosition(5 + i, 6 + i, 'W1N1') }) as RoomPosition
);
const shortDestinations = [{ pos: { __packedPos: packPosition(45, 45, 'W1N1') } as RoomPosition, range: 1 }];
const longDestinations = Array.from({ length: 64 }, (_, i) => ({
  pos: { __packedPos: packPosition(i % 50, (i * 7) % 50, 'W1N1') } as RoomPosition,
  range: i % 4
}));

let _sink = 0;

for (const room of rooms) {
  fromPackedRoomNameCached(room);
}

describe('wrapper/room_name_cache', () => {
  bench('committed_fromPackedRoomName/81_callbacks', () => {
    let checksum = 0;
    for (let i = 0; i < 81; i++) {
      checksum ^= roomLookup.get(fromPackedRoomName(rooms[i % rooms.length])) ?? 0;
    }
    _sink ^= checksum;
  });

  bench('cached_fromPackedRoomName/81_callbacks', () => {
    let checksum = 0;
    for (let i = 0; i < 81; i++) {
      checksum ^= roomLookup.get(fromPackedRoomNameCached(rooms[i % rooms.length])) ?? 0;
    }
    _sink ^= checksum;
  });
});

describe('wrapper/typed_array_allocation', () => {
  bench('committed_start_map/8_positions', () => {
    const packed = new Uint32Array(starts.map(pos => pos.__packedPos));
    _sink ^= packed.length;
  });

  bench('manual_start_fill/8_positions', () => {
    const packed = packPositions(starts);
    _sink ^= packed.length;
  });

  bench('committed_dest_reduce/1_destination', () => {
    const packed = new Uint32Array(
      shortDestinations.reduce((acc, { pos, range }) => {
        acc.push(pos.__packedPos, range);
        return acc;
      }, [] as number[])
    );
    _sink ^= packed.length;
  });

  bench('manual_dest_fill/1_destination', () => {
    const packed = packDestinations(shortDestinations);
    _sink ^= packed?.length ?? 0;
  });

  bench('committed_dest_reduce/64_destinations', () => {
    const packed = new Uint32Array(
      longDestinations.reduce((acc, { pos, range }) => {
        acc.push(pos.__packedPos, range);
        return acc;
      }, [] as number[])
    );
    _sink ^= packed.length;
  });

  bench('manual_dest_fill/64_destinations', () => {
    const packed = packDestinations(longDestinations);
    _sink ^= packed?.length ?? 0;
  });
});

function packPosition(x: number, y: number, roomName: string): number {
  return ((packRoomName(roomName) << 16) | (x << 8) | y) >>> 0;
}

function packRoomName(roomName: string): number {
  if (roomName === 'sim') {
    return 0;
  }

  const [, horizontalDirection, horizontalCoordinate, verticalDirection, verticalCoordinate] =
    roomName.match(/^([WE])(\d+)([NS])(\d+)$/) ?? [];

  let x = Number.parseInt(horizontalCoordinate, 10);
  if (horizontalDirection === 'W') {
    x = ~x;
  }

  let y = Number.parseInt(verticalCoordinate, 10);
  if (verticalDirection === 'N') {
    y = ~y;
  }

  return (((x + HALF_WORLD_SIZE) << 8) | (y + HALF_WORLD_SIZE)) >>> 0;
}
