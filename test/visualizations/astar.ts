import {
  astarMultiroomDistanceMap,
  ClockworkCostMatrix,
  getTerrainCostMatrix as clockworkGetTerrainCostMatrix,
  ClockworkPath,
  ephemeral
} from '../../src/index';


import { cpuTime } from '../utils/cpuTime';
import { FlagVisualizer } from './helpers/FlagVisualizer';
import { visualizeDistanceMap } from './helpers/visualizeDistanceMap';
import { visualizePath } from './helpers/visualizePath';

interface PathResult {
  path: RoomPosition[];
  ops: number;
  cost: number;
  incomplete: boolean;
  cpu: number;
}

interface ComparisonResult {
  clockwork: PathResult;
  pathfinder: PathResult;
}

type CpuComparisonVisualizer = FlagVisualizer & {
  positionQueue: Array<{x: number, y: number}>;
  results: Map<string, ComparisonResult>;
  initialized: boolean;
};

function getTerrainCostMatrix(room: string, { plainCost, swampCost, wallCost }: { plainCost?: number; swampCost?: number; wallCost?: number; } = {}) {
  return ephemeral(clockworkGetTerrainCostMatrix(room, { plainCost, swampCost, wallCost }));
}


let avg_cw_time = 0;
let avg_pf_time = 0;

const cache = new Map<string, ClockworkCostMatrix>();
export default [
  {
    name: 'A* Multiroom Distance Map',
    color1: COLOR_GREEN,
    color2: COLOR_RED,
    /**
     * Visualization of a distance map, where each cell tracks the distance to
     * the nearest flag.
     */
    run(rooms) {
      const [originFlag, ...targetFlags] = Object.values(rooms).reduce((acc, flags) => [...acc, ...flags], []);
      if (!originFlag || targetFlags.length === 0) {
        return;
      }
      const distanceMap = ephemeral(
        astarMultiroomDistanceMap([originFlag.pos], {
          costMatrixCallback: getTerrainCostMatrix,
          maxOps: 10000,
          allOfDestinations: targetFlags.map(flag => flag.pos)
        })
      );
      for (const room of distanceMap.getRooms()) {
        visualizeDistanceMap(room, distanceMap.getRoom(room)!);
      }
    }
  },
  {
    name: 'A* Multiroom Distance Map Path',
    color1: COLOR_GREEN,
    color2: COLOR_GREEN,
    /**
     * Visualization of a Dijkstra multiroom distance map-based path.
     */
    run(rooms) {
      const [originFlag, targetFlag, ...rest] = Object.values(rooms).reduce((acc, flags) => [...acc, ...flags], []);
      if (!originFlag || !targetFlag) {
        return;
      }

      const distanceMap = ephemeral(
        astarMultiroomDistanceMap([originFlag.pos], {
          costMatrixCallback: getTerrainCostMatrix,
          maxOps: 10000,
          anyOfDestinations: [targetFlag.pos]
        })
      );

      const path = ephemeral(distanceMap.pathToOrigin(targetFlag.pos));
      const pathArray = path.toArray();
      visualizePath(pathArray);
    }
  },
  {
    name: 'CPU Usage Comparison Map',
    color1: COLOR_YELLOW,
    color2: COLOR_YELLOW,
    // Queue to store positions that need processing
    positionQueue: [] as Array<{x: number, y: number}>,
    // Store detailed results to persist across ticks
    results: new Map<string, ComparisonResult>(),
    // Flag to track if we've initialized the queue
    initialized: false,

    /**
     * Creates a visualization comparing PathFinder and Clockwork
     * for pathing from every position in the target flag's room back to the origin flag.
     * Shows detailed comparison of path length, cost, operations, and CPU usage.
     * Processes positions incrementally across ticks to stay within CPU limits.
     */
    run(rooms) {
      const [originFlag, targetFlag, ...rest] = Object.values(rooms).reduce((acc, flags) => [...acc, ...flags], []);
      if (!originFlag || !targetFlag) {
        this.initialized = false;
        this.positionQueue = [];
        this.results.clear();
        return;
      }

      const targetRoom = targetFlag.pos.roomName;
      const terrain = Game.map.getRoomTerrain(targetRoom);
      const viz = new RoomVisual(targetRoom);
      // viz.circle(originFlag.pos.x, originFlag.pos.y, {fill: 'blue', radius: 0.3, opacity: 1});

      // Initialize queue if not already done
      if (!this.initialized) {
        this.initialized = true;
        this.positionQueue = [];
        this.results.clear();

        // Add all walkable positions to queue
        for (let y = 0; y < 50; y++) {
          for (let x = 0; x < 50; x++) {
            if (terrain.get(x, y) !== TERRAIN_MASK_WALL && !(originFlag.pos.roomName === targetRoom && originFlag.pos.x === x && originFlag.pos.y === y)) {
              this.positionQueue.push({x, y});
            }
          }
        }
        // Shuffle queue for more interesting visualization
        for (let i = this.positionQueue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.positionQueue[i], this.positionQueue[j]] = [this.positionQueue[j], this.positionQueue[i]];
        }
      }

      // Process positions until we hit CPU limit or queue is empty
      const startCpu = Game.cpu.getUsed();
      const cpuLimit = 100; // CPU limit per tick
      let iterations = 3;
      while (this.positionQueue.length > 0 && (Game.cpu.getUsed() - startCpu) < cpuLimit) {
        const pos = this.positionQueue.pop()!;
        const to = new RoomPosition(pos.x, pos.y, targetRoom);
        const from = originFlag.pos;

        // Measure PathFinder results
        let pathFinderResult;
        const pathFinderTime = cpuTime(() => {
          pathFinderResult = PathFinder.search(from, {pos: to, range: 0}, {
            maxCost: 1500,
            maxOps: 10000,
            roomCallback: roomName => new PathFinder.CostMatrix(),
            heuristicWeight: 1
          });
        }, iterations) / iterations;

        let clockworkResult;
        let clockworkTime = Infinity;
        try {
          // Measure Clockwork results
          clockworkTime = cpuTime(() => {
            const result = jpsPath([from], [to], {
              costMatrixCallback: getTerrainCostMatrix,
              maxOps: 10000
            });
            if (result) {
              // console.log('Clockwork ops', result.ops);
              clockworkResult = {
                path: result.toArray(),
                ops: 0,
                cost: 0,
                incomplete: false
              };
            }
          }, iterations) / iterations;
        } catch (e) {
          console.log('Error at position', pos.x, pos.y, e);
        }

        if (clockworkResult) {
          // @ts-ignore
          console.log('Clockwork ops', clockworkResult.ops, 'pathfinder ops', pathFinderResult?.ops);
          // if (clockworkResult.cost > pathFinderResult?.cost) {
          //   console.log('Clockwork cost', clockworkResult.cost, 'pathfinder cost', pathFinderResult?.cost);
          // }
          // Store detailed results
          const comparison: ComparisonResult = {
            clockwork: {
              // @ts-ignore
              path: clockworkResult.path,
              // @ts-ignore
              ops: clockworkResult.ops,
              // @ts-ignore
              cost: clockworkResult.cost,
              // @ts-ignore
              incomplete: clockworkResult.incomplete,
              cpu: clockworkTime
            },
            pathfinder: {
              // @ts-ignore
              path: [...pathFinderResult.path] as RoomPosition[],
              // @ts-ignore
              ops: pathFinderResult.ops,
              // @ts-ignore
              cost: pathFinderResult.cost,
              // @ts-ignore
              incomplete: pathFinderResult.incomplete,
              cpu: pathFinderTime
            }
          };
          this.results.set(`${pos.x},${pos.y}`, comparison);
        }
      }

      // Draw all results we have so far
      for (const [posStr, result] of this.results) {
        const [x, y] = posStr.split(',').map(Number);
        const { clockwork, pathfinder } = result;
        // console.log("posStr", posStr, "clockwork", clockwork.ops, "pathfinder", pathfinder.ops);
        // Compare path optimality
        if (false) { //(clockwork.cost !== pathfinder.cost || clockwork.path.length !== pathfinder.path.length) {
          // One algorithm found a better path
          // console.log('Clockwork cost', clockwork.cost, 'clockwork path length', clockwork.path.length, 'Pathfinder cost', pathfinder.cost, 'pathfinder path length', pathfinder.path.length);
          const clockworkWon = clockwork.cost <= pathfinder.cost && clockwork.path.length <= pathfinder.path.length;
          let cost = pathfinder.cost - clockwork.cost;
          let length = pathfinder.path.length - clockwork.path.length;
          let text = cost == 0 ? length : cost;
          viz.circle(x, y, {
            radius: 0.3,
            fill: cost >= 0 ? 'green' : 'red',
            stroke: length >= 0 ? 'green' : 'red',
            strokeWidth: 0.1,
            opacity: 0.8
          });
          // viz.text(
          //   cost + " " + length,
          //   x,
          //   y,
          //   {
          //     color: clockworkWon ? 'green' : 'red',
          //     font: 0.3,
          //     align: 'center',
          //     opacity: 1
          //   }
          // );
        } else {
          // Paths are equally optimal, compare ops and CPU
          const clockworkBetterCpu = clockwork.cpu <= pathfinder.cpu;
          const clockworkBetterOps = clockwork.ops <= pathfinder.ops;
          const cpu = (clockwork.cpu - pathfinder.cpu).toFixed(2); 
          const ops = (clockwork.ops - pathfinder.ops);
          if (ops === 0 || true) {
            viz.text(
              cpu,
              x,
              y + 0.1,
              {
                color: clockworkBetterCpu ? 'green' : 'red',
                font: 0.4,
                align: 'center',
                opacity: 1
              }
            );
          } else {
            viz.text(
              cpu,
              x,
              y,
              {
                color: clockworkBetterCpu ? 'green' : 'red',
                font: 0.3,
                align: 'center',
                opacity: 1
              }
            );
            viz.text(
              ops.toString(),
              x,
              y + 0.3,
              {
                color: clockworkBetterOps ? 'green' : 'red',
                font: 0.3,
                align: 'center',
                opacity: 1
              }
            );
          }

          // viz.circle(x, y, {
          //   radius: 0.3,
          //   fill: clockworkBetterOps ? 'green' : 'red',
          //   stroke: clockworkBetterCpu ? 'green' : 'red',
          //   strokeWidth: 0.1,
          //   opacity: 0.8
          // });
        }
      }

      // Show progress
      if (this.positionQueue.length > 0) {
        console.log(`CPU Usage Map: ${Math.floor((1 - this.positionQueue.length / 2500) * 100)}% complete, ${this.positionQueue.length} positions remaining`);
      } else {
        console.log('CPU Usage Map: Complete!');
        
        // Calculate and display overall statistics
        let totalPositions = this.results.size;
        let betterPaths = 0;
        let equalPaths = 0;
        let betterCpu = 0;
        let betterOps = 0;
        
        for (const result of this.results.values()) {
          const { clockwork, pathfinder } = result;
          if (clockwork.cost < pathfinder.cost || clockwork.path.length < pathfinder.path.length) {
            betterPaths++;
          } else if (clockwork.cost === pathfinder.cost && clockwork.path.length === pathfinder.path.length) {
            equalPaths++;
            if (clockwork.cpu < pathfinder.cpu) betterCpu++;
            if (clockwork.ops < pathfinder.ops) betterOps++;
          }
        }
        
        console.log(`
          Statistics:
          Total Positions: ${totalPositions}
          Better Paths: ${betterPaths} (${((betterPaths/totalPositions)*100).toFixed(1)}%)
          Equal Paths: ${equalPaths} (${((equalPaths/totalPositions)*100).toFixed(1)}%)
          Of Equal Paths:
            Better CPU: ${betterCpu} (${((betterCpu/equalPaths)*100).toFixed(1)}%)
            Better Ops: ${betterOps} (${((betterOps/equalPaths)*100).toFixed(1)}%)
        `.replace(/^ +/gm, ''));
      }
    }
  } as CpuComparisonVisualizer
] satisfies FlagVisualizer[];
