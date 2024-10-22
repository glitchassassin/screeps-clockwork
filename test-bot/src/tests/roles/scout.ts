declare global {
  interface CreepMemory {
    room: string;
    scoutTarget?: string;
    useCartographer?: boolean;
  }
  interface RoomMemory {
    visited?: boolean;
  }
}

export const scout = {
  spawn: (spawn: StructureSpawn) => {
    spawn.spawnCreep([MOVE], `${spawn.room.name}_SCOUT_${Game.time % 10000}`, {
      memory: { room: spawn.room.name, role: 'scout' }
    });
  },
  run: (creep: Creep) => {
    // Store intel
    if (!Memory.rooms[creep.pos.roomName]?.visited) {
      Memory.rooms[creep.pos.roomName] = {
        visited: true
      };
      Object.values(Game.map.describeExits(creep.pos.roomName)).forEach(
        adjacentRoom => (Memory.rooms[adjacentRoom] ??= {})
      );
    }

    // If we reached the previous target, pick a new one
    if (!creep.memory.scoutTarget || creep.pos.roomName === creep.memory.scoutTarget) {
      delete creep.memory.scoutTarget;
      for (const room in Memory.rooms) {
        if (!Memory.rooms[room].visited && !Object.values(Game.creeps).some(c => c.memory.scoutTarget === room)) {
          creep.memory.scoutTarget = room;
          break;
        }
      }
    }
    if (!creep.memory.scoutTarget) {
      // no more rooms to scout; reset!
      Memory.rooms = {};
      return;
    }

    creep.moveTo(new RoomPosition(25, 25, creep.memory.scoutTarget), {
      visualizePathStyle: { stroke: 'cyan' },
      range: 20
    });
  }
};
