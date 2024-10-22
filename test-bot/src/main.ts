import { clockwork, initialize } from 'screeps-clockwork';

import { runTestScenarios } from './tests';

export const loop = () => {
  runTestScenarios();
  initialize();
  clockwork.greet();
};
