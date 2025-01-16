import { ErrorMapper } from '../../utils/ErrorMapper';
import { green, red, yellow } from './render';

type TestFunction = () => void;
type SetupFunction = () => void;

interface TestCase {
  name: string;
  fn: TestFunction;
  skip?: boolean;
  timeout?: number;
}

interface TestSuite {
  name: string;
  tests: TestCase[];
  beforeEach?: SetupFunction;
  afterEach?: SetupFunction;
}

type TestResult = 'pending' | 'success' | 'failure';

// Module-level state
const suites = new Map<string, TestSuite>();
let currentSuite: TestSuite | null = null;
let ranSuites = new Set<string>();
let currentTestIndex = 0;
let hasFailures = false;

export function describe(name: string, fn: () => void) {
  currentSuite = { name, tests: [] };
  suites.set(name, currentSuite);
  fn();
  currentSuite = null;
}

export function it(name: string, fn: TestFunction, timeout?: number) {
  if (!currentSuite) throw new Error('Test defined outside of describe block');
  Object.defineProperty(fn, 'name', { value: name.replace(/[^a-zA-Z0-9]/g, '_') });
  currentSuite.tests.push({ name, fn, timeout });
}

export function beforeEach(fn: SetupFunction) {
  if (!currentSuite) throw new Error('beforeEach defined outside of describe block');
  currentSuite.beforeEach = fn;
}

export function afterEach(fn: SetupFunction) {
  if (!currentSuite) throw new Error('afterEach defined outside of describe block');
  currentSuite.afterEach = fn;
}

export function skip(name: string, fn: TestFunction, timeout?: number) {
  if (!currentSuite) throw new Error('Test defined outside of describe block');
  currentSuite.tests.push({ name, fn, skip: true, timeout });
}

export function run(cpuThreshold = 20): TestResult {
  let someRan = false;
  const startTime = Game.cpu.getUsed();

  for (const suiteKey of suites.keys()) {
    if (ranSuites.has(suiteKey)) continue;
    const suite = suites.get(suiteKey);
    if (!suite) break;
    someRan = true;

    while (currentTestIndex < suite.tests.length) {
      if (Game.cpu.getUsed() - startTime > cpuThreshold) {
        return 'pending';
      }

      const { skip, fn, name, timeout } = suite.tests[currentTestIndex];
      if (skip) {
        console.log(`[ ${yellow('SKIP')}    ] ${suite.name} - ${name}`);
        currentTestIndex++;
        continue;
      }

      const startCpu = Game.cpu.getUsed();
      let cpuUsed = 0;
      const timeoutLimit = timeout ?? 5;

      try {
        suite.beforeEach?.();
        fn();
        suite.afterEach?.();
      } catch (error) {
        console.log(`[ ${red('FAIL')}    ] ${suite.name} - ${name}`);
        if (error instanceof Error) {
          console.log(ErrorMapper.sourceMappedStackTrace(error));
        }
        hasFailures = true;
        continue;
      } finally {
        cpuUsed = Game.cpu.getUsed() - startCpu;
        currentTestIndex++;
      }

      if (cpuUsed > timeoutLimit) {
        console.log(
          `[ ${red('TIMEOUT')} ] ${suite.name} - ${name} (${cpuUsed.toFixed(2)} CPU > ${timeoutLimit} CPU limit)`
        );
        hasFailures = true;
        continue;
      }

      console.log(`[ ${green('PASS')}    ] ${suite.name} - ${name} (${cpuUsed.toFixed(2)} CPU)`);
    }

    currentTestIndex = 0;
    ranSuites.add(suiteKey);
  }

  if (hasFailures) {
    if (someRan) console.log('❌ Some tests failed');
    return 'failure';
  } else {
    if (someRan) console.log('✅ All tests passed');
    return 'success';
  }
}

export interface Matchers<T> {
  toBe(expected: T): void;
  toEqual(expected: any): void;
  toBeDefined(): void;
  toBeUndefined(): void;
  toBeNull(): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeGreaterThan(expected: number): void;
  toBeLessThan(expected: number): void;
  toContain(expected: any): void;
  toHaveLength(expected: number): void;
  toThrow(expected?: string | RegExp): void;
}

function cleanError(message: string): Error {
  const error = new Error(message);
  // Remove the first line of the stack trace (which is the matcher function)
  if (error.stack) {
    const lines = error.stack.split('\n');
    error.stack = [lines[0], ...lines.slice(3)].join('\n');
  }
  return error;
}

export function expect<T>(actual: T) {
  return {
    toBe: (expected: T) => {
      if (actual !== expected) {
        throw cleanError(`Expected ${expected} but received ${actual}`);
      }
    },
    toEqual: (expected: any) => {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw cleanError(`Expected ${expectedStr} but received ${actualStr}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw cleanError(`Expected value to be defined but received undefined`);
      }
    },
    toBeUndefined: () => {
      if (actual !== undefined) {
        throw cleanError(`Expected value to be undefined but received ${actual}`);
      }
    },
    toBeNull: () => {
      if (actual !== null) {
        throw cleanError(`Expected value to be null but received ${actual}`);
      }
    },
    toBeTruthy: () => {
      if (!actual) {
        throw cleanError(`Expected value to be truthy but received ${actual}`);
      }
    },
    toBeFalsy: () => {
      if (actual) {
        throw cleanError(`Expected value to be falsy but received ${actual}`);
      }
    },
    toBeGreaterThan: (expected: number) => {
      if (typeof actual !== 'number') {
        throw cleanError(`Expected a number but received ${typeof actual}`);
      }
      if (actual <= expected) {
        throw cleanError(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeGreaterThanOrEqual: (expected: number) => {
      if (typeof actual !== 'number') {
        throw cleanError(`Expected a number but received ${typeof actual}`);
      }
      if (actual < expected) {
        throw cleanError(`Expected ${actual} to be greater than or equal to ${expected}`);
      }
    },
    toBeLessThan: (expected: number) => {
      if (typeof actual !== 'number') {
        throw cleanError(`Expected a number but received ${typeof actual}`);
      }
      if (actual >= expected) {
        throw cleanError(`Expected ${actual} to be less than ${expected}`);
      }
    },
    toBeLessThanOrEqual: (expected: number) => {
      if (typeof actual !== 'number') {
        throw cleanError(`Expected a number but received ${typeof actual}`);
      }
      if (actual > expected) {
        throw cleanError(`Expected ${actual} to be less than or equal to ${expected}`);
      }
    },
    toContain: (expected: any) => {
      if (!Array.isArray(actual) && typeof actual !== 'string') {
        throw cleanError(`Expected an array or string but received ${typeof actual}`);
      }
      if (!actual.includes(expected)) {
        throw cleanError(`Expected ${actual} to contain ${expected}`);
      }
    },
    toHaveLength: (expected: number) => {
      if (actual === null || (typeof actual !== 'object' && typeof actual !== 'string')) {
        throw cleanError(`Expected value to have length but received ${typeof actual}`);
      }
      if ((actual as any).length !== expected) {
        throw cleanError(`Expected length of ${expected} but received ${(actual as any).length}`);
      }
    },
    toThrow: (expected?: string | RegExp) => {
      if (typeof actual !== 'function') {
        throw cleanError('Expected a function');
      }
      try {
        actual();
        throw cleanError('Expected function to throw');
      } catch (error) {
        if (expected) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (expected instanceof RegExp) {
            if (!expected.test(errorMessage)) {
              throw cleanError(`Expected error matching ${expected} but got "${errorMessage}"`);
            }
          } else if (errorMessage !== expected) {
            throw cleanError(`Expected error "${expected}" but got "${errorMessage}"`);
          }
        }
      }
    }
  };
}
