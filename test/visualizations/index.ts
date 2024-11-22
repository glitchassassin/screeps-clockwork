import {
  visualizeBfsDistanceMap,
  visualizeBfsDistanceMapBasin,
  visualizeBfsFlowField,
  visualizeBfsMonoFlowField
} from './bfs';

export function visualize() {
  visualizeBfsDistanceMap();
  visualizeBfsFlowField();
  visualizeBfsMonoFlowField();
  visualizeBfsDistanceMapBasin();
}
