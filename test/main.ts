import { initialize } from '../src/index';

import { runTestScenarios } from './basicBot';
import { TEST_PORTALS } from './fixtures/portals';
import { run } from './tests';
import { visualize } from './visualizations';

export const loop = () => {
  if (Game.cpu.bucket > 500) {
    runTestScenarios();
  }
  initialize({ verbose: true, portals: TEST_PORTALS });
  run();
  visualize();
};
