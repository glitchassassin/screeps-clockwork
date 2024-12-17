import astarVisualizers from './astar';
import bfsVisualizers from './breadthFirstSearch';
import dijkstraVisualizers from './dijkstra';
import { runVisualizers } from './helpers/FlagVisualizer';
import { showPersisted } from './helpers/persist';

export function visualize() {
  runVisualizers([...bfsVisualizers, ...dijkstraVisualizers, ...astarVisualizers]);
  showPersisted();
}
