import {
  visualizeBfsDistanceMap,
  visualizeBfsDistanceMapBasin,
  visualizeBfsFlowField,
  visualizeBfsMonoFlowField
} from './breadthFirstSearch';
import {
  visualizeDijkstraDistanceMap,
  visualizeDijkstraDistanceMapBasin,
  visualizeDijkstraFlowField,
  visualizeDijkstraMonoFlowField
} from './dijkstra';
import { showPersisted } from './helpers/persist';

export function visualize() {
  visualizeBfsDistanceMap();
  visualizeBfsFlowField();
  visualizeBfsMonoFlowField();
  visualizeBfsDistanceMapBasin();
  visualizeDijkstraDistanceMap();
  visualizeDijkstraFlowField();
  visualizeDijkstraMonoFlowField();
  visualizeDijkstraDistanceMapBasin();

  Object.keys(Game.rooms).forEach(showPersisted);
}
