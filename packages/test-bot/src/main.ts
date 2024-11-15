import { initialize } from 'screeps-clockwork';

import { visualize } from 'visualizations';
import { runTestScenarios } from './tests';

export const loop = () => {
  runTestScenarios();
  initialize(true);
  visualize();
};
