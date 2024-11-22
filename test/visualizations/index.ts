import {
  visualizeBfsDistanceMap,
  visualizeBfsDistanceMapBasin,
  visualizeBfsFlowField,
  visualizeBfsMonoFlowField
} from './breadthFirstSearch';

export function visualize() {
  visualizeBfsDistanceMap();
  visualizeBfsFlowField();
  visualizeBfsMonoFlowField();
  visualizeBfsDistanceMapBasin();
}
