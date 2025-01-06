import { jpsPath } from '../../../../src/index';
import { cpuTime } from '../../../utils/cpuTime';
import { describe, expect, it } from '../../helpers';
const UNREACHABLE = 0xffffffff;

describe('jpsPath', () => {
  it('should be faster than PathFinder.search', () => {
    const from = new RoomPosition(5, 5, 'W1N1');
    const to = new RoomPosition(45, 45, 'W1N1');
    const iterations = 1;

    let pathFinderPath: PathFinderPath;
    const pathFinderTime = cpuTime(() => {
      pathFinderPath = PathFinder.search(from, to, {
        maxCost: 1500,
        maxOps: 10000,
        heuristicWeight: 1
      });
    }, iterations);

    let clockworkPath: ReturnType<typeof jpsPath>;
    jpsPath(from, [to]);
    const clockworkTime = cpuTime(() => {
      clockworkPath = jpsPath(from, [to]);
    }, iterations);

    console.log('Clockwork Time', clockworkTime);
    console.log('Clockwork Path', clockworkPath!.length);
    console.log('PathFinder Time', pathFinderTime);
    console.log(
      'PathFinder Path',
      pathFinderPath!.path.length,
      'ops',
      pathFinderPath!.ops,
      'cost',
      pathFinderPath!.cost,
      'incomplete',
      pathFinderPath!.incomplete
    );

    console.log('Clockwork Path', clockworkPath!);
    console.log('PathFinder Path', pathFinderPath!.path);

    // visualizePath(clockworkPath!, 'green');
    // visualizePath(pathFinderPath!.path, 'red');
    // persistVisualizations('W1N1', 50);

    expect(clockworkPath!.length).toBeLessThan(pathFinderPath!.path.length + 1); // less than or equal
    expect(clockworkTime).toBeLessThan(pathFinderTime);
  }, 50);
});
