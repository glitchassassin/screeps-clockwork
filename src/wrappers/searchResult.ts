import { fromPacked } from '../utils/fromPacked';
import { SearchResult } from '../wasm/screeps_clockwork';
import { ClockworkMultiroomDistanceMap } from './multiroomDistanceMap';

export function fromPackedSearchResult(result: SearchResult) {
  try {
    const foundTargets = result.found_targets.reduce((acc, pos) => {
      acc.push(fromPacked(pos));
      return acc;
    }, [] as RoomPosition[]);
    const distanceMap = new ClockworkMultiroomDistanceMap(result.distance_map);
    const ops = result.ops;

    return {
      distanceMap,
      foundTargets,
      ops
    };
  } finally {
    result.free();
  }
}
