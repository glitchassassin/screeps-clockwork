import {
  ClockworkCostMatrix,
  astarPortalMultiroomDistanceMap,
  bfsPortalMultiroomDistanceMap,
  debugPortalIndex,
  dijkstraPortalMultiroomDistanceMap,
  getTerrainCostMatrix
} from '../../../../src/index';
import { TEST_PORTALS } from '../../../fixtures/portals';
import { formatCpuTime, cpuTime } from '../../../utils/cpuTime';
import { describe, expect, it } from '../../helpers';

const [[portalEntry, portalExit]] = TEST_PORTALS;
const start = new RoomPosition(portalEntry.x - 1, portalEntry.y, portalEntry.roomName);
const stepAfterExit = new RoomPosition(portalExit.x + 1, portalExit.y, portalExit.roomName);
const target = new RoomPosition(portalExit.x + 2, portalExit.y, portalExit.roomName);

function plainCostMatrix() {
  return new ClockworkCostMatrix(1);
}

function portalRoomsCostMatrix(roomName: string) {
  if (roomName === portalEntry.roomName || roomName === portalExit.roomName) {
    return plainCostMatrix();
  }
  return undefined;
}

function expectPath(path: RoomPosition[], expected: RoomPosition[]) {
  expect(path.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(path[i].isEqualTo(expected[i])).toBe(true);
  }
}

function logPortalIndexDebug(label: string) {
  console.logUnsafe(`PortalIndex Debug ${label}`, JSON.stringify(debugPortalIndex()));
}

function cachedTerrainCostMatrix() {
  const cache = new Map<string, ClockworkCostMatrix>();
  return (roomName: string) => {
    if (cache.has(roomName)) {
      return cache.get(roomName);
    }
    const costMatrix = getTerrainCostMatrix(roomName);
    cache.set(roomName, costMatrix);
    return costMatrix;
  };
}

function expectPortalAstarToBeatPathFinder(from: RoomPosition, to: RoomPosition, label: string) {
  const costMatrixCallback = cachedTerrainCostMatrix();
  const destination = [{ pos: to, range: 0 }];
  const iterationsPerSample = label === 'single-room' ? 10 : 1;
  const samples = label === 'single-room' ? 20 : 10;
  const timingOptions = { iterations: iterationsPerSample * samples, batchSize: iterationsPerSample };

  let pathFinderPath: PathFinderPath;
  const pathFinderTime = cpuTime(() => {
    pathFinderPath = PathFinder.search(from, to, {
      maxCost: 1500,
      maxOps: 10000,
      roomCallback: () => new PathFinder.CostMatrix(),
      heuristicWeight: 1
    });
  }, timingOptions);

  let clockworkPathLength = 0;
  let clockworkOps = 0;
  const clockworkTime = cpuTime(() => {
    const { distanceMap, ops } = astarPortalMultiroomDistanceMap([from], {
      costMatrixCallback,
      anyOfDestinations: destination
    });
    let clockworkPath;
    try {
      clockworkPath = distanceMap.pathToOriginWithPortals(to);
      clockworkPathLength = clockworkPath.length;
      clockworkOps = ops;
    } finally {
      clockworkPath?.free();
      distanceMap.free();
    }
  }, timingOptions);

  console.logUnsafe(`Portal A* ${label} Time`, formatCpuTime(clockworkTime));
  console.logUnsafe(`Portal A* ${label} Path`, clockworkPathLength);
  console.logUnsafe(`Portal A* ${label} Ops`, clockworkOps);
  console.logUnsafe(`PathFinder ${label} Time`, formatCpuTime(pathFinderTime));
  console.logUnsafe(`PathFinder ${label} Path`, pathFinderPath!.path.length);
  console.logUnsafe(`PathFinder ${label} Ops`, pathFinderPath!.ops);

  expect(clockworkPathLength).toBeLessThanOrEqual(pathFinderPath!.path.length + 1);
  expect(clockworkTime.mean).toBeLessThan(pathFinderTime.mean);
}

describe('portalMultiroomDistanceMap', () => {
  it('should use globally configured portals', () => {
    const distanceMap = bfsPortalMultiroomDistanceMap([start], {
      costMatrixCallback: portalRoomsCostMatrix,
      maxOps: 100,
      maxRooms: 2,
      anyOfDestinations: [{ pos: target, range: 0 }]
    }).distanceMap;

    expect(distanceMap.get(portalExit)).toBe(1);
    expect(distanceMap.get(target)).toBe(3);
    logPortalIndexDebug('globally configured portals');
  });

  it('should charge the portal entrance tile for Dijkstra searches', () => {
    const originMatrix = plainCostMatrix();
    originMatrix.set(portalEntry.x, portalEntry.y, 9);

    const distanceMap = dijkstraPortalMultiroomDistanceMap([start], {
      costMatrixCallback: roomName => {
        if (roomName === portalEntry.roomName) return originMatrix;
        if (roomName === portalExit.roomName) return plainCostMatrix();
        return undefined;
      },
      maxOps: 10000,
      maxRooms: 2,
      anyOfDestinations: [{ pos: target, range: 0 }]
    }).distanceMap;

    expect(distanceMap.get(portalExit)).toBe(9);
    expect(distanceMap.get(target)).toBe(11);
    logPortalIndexDebug('Dijkstra entrance cost');
  });

  it('should find the same portal route with A* and Dijkstra', () => {
    const destinations = [{ pos: target, range: 0 }];

    const dijkstraDistanceMap = dijkstraPortalMultiroomDistanceMap([start], {
      costMatrixCallback: portalRoomsCostMatrix,
      maxOps: 10000,
      maxRooms: 2,
      anyOfDestinations: destinations
    }).distanceMap;

    const astarDistanceMap = astarPortalMultiroomDistanceMap([start], {
      costMatrixCallback: portalRoomsCostMatrix,
      maxOps: 10000,
      maxRooms: 2,
      anyOfDestinations: destinations
    }).distanceMap;

    expect(astarDistanceMap.get(target)).toBe(dijkstraDistanceMap.get(target));
    logPortalIndexDebug('A* and Dijkstra route');
  });

  it('should reconstruct portal-aware paths from distance maps and flow fields', () => {
    const distanceMap = dijkstraPortalMultiroomDistanceMap([target], {
      costMatrixCallback: portalRoomsCostMatrix,
      maxOps: 10000,
      maxRooms: 2
    }).distanceMap;
    const expected = [start, portalEntry, portalExit, stepAfterExit, target];
    const expectedFromPortal = [portalEntry, portalExit, stepAfterExit, target];

    expectPath(distanceMap.pathToOriginWithPortals(start).toArray(), expected);
    expectPath(distanceMap.pathToOriginWithPortals(portalEntry).toArray(), expectedFromPortal);

    const flowField = distanceMap.toFlowFieldWithPortals();
    expect(flowField.getDirections(start)).toContain(RIGHT);
    expectPath(flowField.pathToOriginWithPortals(start).toArray(), expected);
    expectPath(flowField.pathToOriginWithPortals(portalEntry).toArray(), expectedFromPortal);

    const monoFlowField = distanceMap.toMonoFlowFieldWithPortals();
    expect(monoFlowField.get(start)).toBe(RIGHT);
    expectPath(monoFlowField.pathToOriginWithPortals(start).toArray(), expected);
    expectPath(monoFlowField.pathToOriginWithPortals(portalEntry).toArray(), expectedFromPortal);
    logPortalIndexDebug('path reconstruction');
  });

  it('portal A* should be faster than PathFinder.search across one room', () => {
    expectPortalAstarToBeatPathFinder(new RoomPosition(5, 5, 'W1N1'), new RoomPosition(45, 45, 'W1N1'), 'single-room');
    logPortalIndexDebug('single-room A* benchmark');
  }, 50);

  it('portal A* should be faster than PathFinder.search across multiple rooms', () => {
    expectPortalAstarToBeatPathFinder(new RoomPosition(5, 5, 'W1N2'), new RoomPosition(5, 5, 'W2N2'), 'multi-room');
    logPortalIndexDebug('multi-room A* benchmark');
  }, 100);
});
