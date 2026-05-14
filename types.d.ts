interface Console {
  logUnsafe(...data: unknown[]): void;
}

interface RoomPosition {
  __packedPos: number;
}
