import { clockwork, initialize } from 'screeps-clockwork';

import { testEcho } from 'tests/testEcho';
import { runTestScenarios } from './tests';

export const loop = () => {
  runTestScenarios();
  initialize();
  clockwork.greet();

  if (Game.cpu.bucket > 1000) {
    testEcho();
  }
};
