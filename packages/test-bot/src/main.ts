import { greet, initialize } from 'screeps-clockwork';

import { visualize } from 'visualizations';
import { runTestScenarios } from './tests';

export const loop = () => {
  runTestScenarios();
  initialize();
  greet();
  visualize();
};
