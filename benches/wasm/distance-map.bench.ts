import { createRequire } from 'node:module';
import { bench, describe } from 'vitest';

import { distanceMapScenarios, type DistanceMapScenario, type WasmModule } from './fixtures';
import type * as Wasm from './pkg/screeps_clockwork';

const require = createRequire(import.meta.url);
const wasm = require('./pkg/screeps_clockwork.cjs') as WasmModule;
const scenarios = distanceMapScenarios(wasm);
const CARDINAL_FIRST = wasm.DirectionOrder.CardinalFirst;
const derivedScenarios = scenarios.map(createDerivedScenario);

let _sink = 0;

describe('wasm/distance_map/dijkstra_vs_astar', () => {
  for (const scenario of scenarios) {
    bench(`dijkstra/${scenario.name}`, () => {
      const result = wasm.js_dijkstra_multiroom_distance_map(
        scenario.startArray,
        scenario.costMatrixCallback,
        scenario.maxOps,
        scenario.maxRooms,
        scenario.maxPathCost,
        scenario.destinationArray,
        undefined
      );
      _sink ^= result.ops;
      result.free();
    });

    bench(`astar/${scenario.name}`, () => {
      const result = wasm.js_astar_multiroom_distance_map(
        scenario.startArray,
        scenario.costMatrixCallback,
        scenario.maxRooms,
        scenario.maxOps,
        scenario.maxPathCost,
        scenario.destinationArray,
        undefined
      );
      _sink ^= result.ops;
      result.free();
    });
  }
});

describe('wasm/distance_map/bfs', () => {
  for (const scenario of scenarios) {
    bench(`bfs/${scenario.name}`, () => {
      const result = wasm.js_bfs_multiroom_distance_map(
        scenario.startArray,
        scenario.costMatrixCallback,
        scenario.maxOps,
        scenario.maxRooms,
        scenario.maxPathCost,
        scenario.destinationArray,
        undefined
      );
      _sink ^= result.ops;
      result.free();
    });
  }
});

describe('wasm/flow_field', () => {
  for (const scenario of derivedScenarios) {
    bench(`multiroom_flow_field/${scenario.name}`, () => {
      const flowField = wasm.multiroomFlowField(scenario.distanceMap, CARDINAL_FIRST);
      _sink ^= flowField.get(scenario.pathStart);
      flowField.free();
    });

    bench(`multiroom_mono_flow_field/${scenario.name}`, () => {
      const flowField = wasm.multiroomMonoFlowField(scenario.distanceMap, CARDINAL_FIRST);
      _sink ^= flowField.get(scenario.pathStart) ?? 0;
      flowField.free();
    });
  }
});

describe('wasm/path', () => {
  for (const scenario of derivedScenarios) {
    bench(`distance_map_origin/${scenario.name}`, () => {
      const path = wasm.js_path_to_multiroom_distance_map_origin(
        scenario.pathStart,
        scenario.distanceMap,
        CARDINAL_FIRST
      );
      _sink ^= path.len();
      path.free();
    });

    bench(`flow_field_origin/${scenario.name}`, () => {
      const path = wasm.js_path_to_multiroom_flow_field_origin(scenario.pathStart, scenario.flowField);
      _sink ^= path.len();
      path.free();
    });

    bench(`mono_flow_field_origin/${scenario.name}`, () => {
      const path = wasm.js_path_to_multiroom_mono_flow_field_origin(scenario.pathStart, scenario.monoFlowField);
      _sink ^= path.len();
      path.free();
    });

    bench(`distance_map_origin_to_array/${scenario.name}`, () => {
      const path = wasm.js_path_to_multiroom_distance_map_origin(
        scenario.pathStart,
        scenario.distanceMap,
        CARDINAL_FIRST
      );
      const positions = path.to_array();
      _sink ^= positions.length;
      path.free();
    });
  }
});

describe('wasm/boundary', () => {
  const scenario = derivedScenarios[0];

  bench('multiroom_distance_map_get/2500_tiles', () => {
    let checksum = 0;
    const roomPrefix = scenario.pathStart & 0xffff0000;
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        checksum ^= scenario.distanceMap.get((roomPrefix | (x << 8) | y) >>> 0);
      }
    }
    _sink ^= checksum;
  });

  bench('distance_map_get_room_to_array/2500_tiles', () => {
    const room = scenario.distanceMap.get_room((scenario.pathStart >>> 16) & 0xffff);
    if (!room) {
      throw new Error(`Missing benchmark room for ${scenario.name}`);
    }
    const values = room.toArray();
    _sink ^= values.length;
    room.free();
  });
});

interface DerivedScenario {
  name: string;
  pathStart: number;
  distanceMap: Wasm.MultiroomDistanceMap;
  flowField: Wasm.MultiroomFlowField;
  monoFlowField: Wasm.MultiroomMonoFlowField;
}

function createDerivedScenario(scenario: DistanceMapScenario): DerivedScenario {
  const searchResult = wasm.js_bfs_multiroom_distance_map(
    scenario.startArray,
    scenario.costMatrixCallback,
    scenario.maxOps,
    scenario.maxRooms,
    scenario.maxPathCost,
    scenario.destinationArray,
    undefined
  );
  const foundTargets = searchResult.found_targets;
  const pathStart = foundTargets[0] ?? scenario.target;
  const distanceMap = searchResult.distance_map;
  const flowField = wasm.multiroomFlowField(distanceMap, CARDINAL_FIRST);
  const monoFlowField = wasm.multiroomMonoFlowField(distanceMap, CARDINAL_FIRST);
  searchResult.free();

  return {
    name: scenario.name,
    pathStart,
    distanceMap,
    flowField,
    monoFlowField
  };
}
