import { initialize } from 'screeps-clockwork';

import { run } from 'tests';
import { visualize } from 'visualizations';
import { runTestScenarios } from './basicBot';

export const loop = () => {
  runTestScenarios();
  initialize(true);
  run();
  visualize();
};
