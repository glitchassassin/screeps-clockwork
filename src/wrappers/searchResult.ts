import { fromPacked } from '../utils/fromPacked';
import { SearchResult } from '../wasm/screeps_clockwork';
import { ClockworkMultiroomDistanceMap } from './multiroomDistanceMap';

export function fromPackedSearchResult(result: SearchResult) {
  const foundTargets = result.found_targets.reduce((acc, pos) => {
    acc.push(fromPacked(pos));
    return acc;
  }, [] as RoomPosition[]);
  const distanceMap = new ClockworkMultiroomDistanceMap(result.distance_map);
  const ops = result.ops;
  result.free();

  return {
    distanceMap,
    foundTargets,
    ops
  };
}
