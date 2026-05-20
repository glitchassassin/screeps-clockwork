interface PackedDestination {
  pos: RoomPosition;
  range: number;
}

export type PortalPair = readonly [RoomPosition, RoomPosition];

export function packPositions(positions: RoomPosition[]): Uint32Array {
  const packed = new Uint32Array(positions.length);
  for (let i = 0; i < positions.length; i++) {
    packed[i] = positions[i].__packedPos;
  }
  return packed;
}

export function packDestinations(destinations: PackedDestination[] | undefined): Uint32Array | undefined {
  if (!destinations) {
    return undefined;
  }

  const packed = new Uint32Array(destinations.length * 2);
  for (let i = 0; i < destinations.length; i++) {
    const offset = i * 2;
    packed[offset] = destinations[i].pos.__packedPos;
    packed[offset + 1] = destinations[i].range;
  }
  return packed;
}

export function packPortalPairs(portals: readonly PortalPair[]): Uint32Array {
  const packed = new Uint32Array(portals.length * 2);
  for (let i = 0; i < portals.length; i++) {
    const offset = i * 2;
    packed[offset] = portals[i][0].__packedPos;
    packed[offset + 1] = portals[i][1].__packedPos;
  }
  return packed;
}
