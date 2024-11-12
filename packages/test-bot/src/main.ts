import { clockwork, getRange, initialize } from 'screeps-clockwork';

import { runTestScenarios } from './tests';

function testTime(label: string, fn: () => void) {
  const start = Game.cpu.getUsed();
  for (let i = 0; i < 1000; i++) {
    fn();
  }
  const end = Game.cpu.getUsed();
  console.log(`${label}: ${(end - start).toFixed(3)} for 1000 iterations`);
}

export const getRangeTo = (from: RoomPosition, to: RoomPosition) => {
  if (from.roomName === to.roomName) return from.getRangeTo(to);

  // Calculate global positions
  let fromGlobal = globalPosition(from);
  let toGlobal = globalPosition(to);

  return Math.max(Math.abs(fromGlobal.x - toGlobal.x), Math.abs(fromGlobal.y - toGlobal.y));
};

export const roomNameToCoords = (roomName: string) => {
  let match = roomName.match(/^([WE])([0-9]+)([NS])([0-9]+)$/);
  if (!match) throw new Error('Invalid room name');
  let [, h, wx, v, wy] = match;
  return {
    wx: h == 'W' ? ~Number(wx) : Number(wx),
    wy: v == 'N' ? ~Number(wy) : Number(wy)
  };
};

export const globalPosition = (pos: RoomPosition) => {
  let { x, y, roomName } = pos;
  if (x < 0 || x >= 50) throw new RangeError('x value ' + x + ' not in range');
  if (y < 0 || y >= 50) throw new RangeError('y value ' + y + ' not in range');
  if (roomName == 'sim') throw new RangeError('Sim room does not have world position');
  let { wx, wy } = roomNameToCoords(roomName);
  return {
    x: 50 * Number(wx) + x,
    y: 50 * Number(wy) + y
  };
};

export const loop = () => {
  runTestScenarios();
  initialize();
  clockwork.greet();

  const pos1 = new RoomPosition(25, 25, 'W0N0');
  const pos2 = new RoomPosition(25, 25, 'W10N10');
  testTime('wasm getRange', () => {
    getRange(pos1, pos2);
  });
  testTime('js getRangeTo', () => {
    getRangeTo(pos1, pos2);
  });
  console.log('getRange === getRangeTo?', getRange(pos1, pos2) === getRangeTo(pos1, pos2) ? 'yes' : 'no');
};
