import { initialize } from '../src/index';

import { runTestScenarios } from './basicBot';
import { run } from './tests';
import { visualize } from './visualizations';

export const loop = () => {
  runTestScenarios();
  initialize(true);
  run();
  visualize();
};
