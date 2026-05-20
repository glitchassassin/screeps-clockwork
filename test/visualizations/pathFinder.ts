import { FlagVisualizer } from './helpers/FlagVisualizer';
import { visualizePath } from './helpers/visualizePath';

export default [
  {
    name: 'PathFinder Path',
    color1: COLOR_WHITE,
    color2: COLOR_GREEN,
    run(rooms) {
      const [originFlag, targetFlag] = Object.values(rooms).reduce((acc, flags) => [...acc, ...flags], []);
      if (!originFlag || !targetFlag) {
        return;
      }

      const result = PathFinder.search(
        originFlag.pos,
        { pos: targetFlag.pos, range: 0 },
        {
          maxOps: 10000,
          heuristicWeight: 1
        }
      );

      visualizePath([originFlag.pos, ...result.path]);
    }
  }
] satisfies FlagVisualizer[];
