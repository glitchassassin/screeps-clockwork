import {
  visualizeBfsDistanceMap,
  visualizeBfsDistanceMapBasin,
  visualizeBfsFlowField,
  visualizeBfsMonoFlowField,
  visualizeBfsPath
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
  visualizeBfsPath();
  visualizeDijkstraDistanceMap();
  visualizeDijkstraFlowField();
  visualizeDijkstraMonoFlowField();
  visualizeDijkstraDistanceMapBasin();
  Object.keys(Game.rooms).forEach(showPersisted);
}
