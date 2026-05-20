import astarVisualizers from './astar';
import bfsVisualizers from './breadthFirstSearch';
import dijkstraVisualizers from './dijkstra';
import { runVisualizers } from './helpers/FlagVisualizer';
import { showPersisted } from './helpers/persist';
import pathFinderVisualizers from './pathFinder';
import portalVisualizers from './portals';

export function visualize() {
  runVisualizers([
    ...bfsVisualizers,
    ...dijkstraVisualizers,
    ...astarVisualizers,
    ...pathFinderVisualizers,
    ...portalVisualizers
  ]);
  showPersisted();
}
