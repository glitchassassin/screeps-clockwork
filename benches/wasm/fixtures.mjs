import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOM_SIZE = 50;
const ROOM_AREA = ROOM_SIZE * ROOM_SIZE;
const HALF_WORLD_SIZE = 128;
const PLAIN_COST = 1;
const SWAMP_COST = 5;
const WALL_COST = 255;
const FIXTURE_DIR = dirname(fileURLToPath(import.meta.url));
const PRIVATE_SERVER_SECTOR = privateServerSectorFixture();

export function distanceMapScenarios(wasm) {
  const emptyRoomName = packRoomName('W1N1');
  const realisticW1N1 = packRoomName('W1N1');
  const realisticW8N8 = packRoomName('W8N8');
  const privateServerSector = Object.entries(PRIVATE_SERVER_SECTOR.rooms);

  return [
    {
      name: 'empty_room/opposite_corners',
      start: packPosition(5, 5, 'W1N1'),
      target: packPosition(45, 45, 'W1N1'),
      targetRange: 0,
      maxRooms: 1,
      maxOps: ROOM_AREA,
      maxPathCost: 1000,
      costMatrices: new Map([[emptyRoomName, new wasm.ClockworkCostMatrix(PLAIN_COST)]])
    },
    {
      name: 'empty_multiroom/diagonal_four_rooms',
      start: packPosition(5, 5, 'W1N1'),
      target: packPosition(45, 45, 'W2N2'),
      targetRange: 0,
      maxRooms: 4,
      maxOps: ROOM_AREA * 4,
      maxPathCost: 5000,
      fallbackCostMatrix: new wasm.ClockworkCostMatrix(PLAIN_COST)
    },
    {
      name: 'realistic_room/private_server_W1N1',
      start: packPosition(16, 14, 'W1N1'),
      target: packPosition(14, 45, 'W1N1'),
      targetRange: 1,
      maxRooms: 1,
      maxOps: ROOM_AREA,
      maxPathCost: 1000,
      costMatrices: new Map([[realisticW1N1, terrainCostMatrix(wasm, PRIVATE_SERVER_SECTOR.rooms.W1N1)]])
    },
    {
      name: 'realistic_room/private_server_W8N8',
      start: packPosition(29, 41, 'W8N8'),
      target: packPosition(37, 19, 'W8N8'),
      targetRange: 1,
      maxRooms: 1,
      maxOps: ROOM_AREA,
      maxPathCost: 1000,
      costMatrices: new Map([[realisticW8N8, terrainCostMatrix(wasm, PRIVATE_SERVER_SECTOR.rooms.W8N8)]])
    },
    {
      name: 'private_server_sector/W1N1_to_W9N9',
      start: packPosition(29, 41, 'W1N1'),
      target: packPosition(8, 41, 'W9N9'),
      targetRange: 1,
      maxRooms: privateServerSector.length,
      maxOps: ROOM_AREA * privateServerSector.length,
      maxPathCost: 50000,
      costMatrices: new Map(
        privateServerSector.map(([roomName, terrain]) => [packRoomName(roomName), terrainCostMatrix(wasm, terrain)])
      )
    }
  ].map(prepareScenario);
}

function prepareScenario(scenario) {
  return {
    ...scenario,
    startArray: new Uint32Array([scenario.start]),
    destinationArray: new Uint32Array([scenario.target, scenario.targetRange]),
    costMatrixCallback: costMatrixCallback(scenario)
  };
}

function costMatrixCallback(scenario) {
  return room => scenario.costMatrices?.get(room) ?? scenario.fallbackCostMatrix;
}

export function packPosition(x, y, roomName) {
  return ((packRoomName(roomName) << 16) | (x << 8) | y) >>> 0;
}

export function packRoomName(roomName) {
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

function terrainCostMatrix(wasm, terrain) {
  if (terrain.length !== ROOM_AREA) {
    throw new Error(`Expected terrain length ${ROOM_AREA}, received ${terrain.length}`);
  }

  const matrix = new wasm.ClockworkCostMatrix();
  for (let y = 0; y < ROOM_SIZE; y++) {
    for (let x = 0; x < ROOM_SIZE; x++) {
      const terrainCode = terrain.charCodeAt(y * ROOM_SIZE + x) - 48;
      const cost = terrainCode & 1 ? WALL_COST : terrainCode & 2 ? SWAMP_COST : PLAIN_COST;
      matrix.set(x, y, cost);
    }
  }
  return matrix;
}

function privateServerSectorFixture() {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, '../fixtures/terrain/private_server_sector.json'), 'utf8'));
}
