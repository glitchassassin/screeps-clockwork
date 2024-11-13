import { clockwork } from 'screeps-clockwork';
import { testTime } from './testTime';

export function testEcho() {
  const num = 123;
  const singleCharStr = 'h';
  const str = 'h'.repeat(100); // String of 100 characters
  const longStr = 'h'.repeat(10000); // String of 10000 characters
  const singleItemArr = new Uint32Array([1]);
  const arr = new Uint32Array(Array.from({ length: 100 }, (_, i) => i)); // Array of 100 numbers
  const longArr = new Uint32Array(Array.from({ length: 10000 }, (_, i) => i)); // Array of 10000 numbers

  testTime('echo_num', () => clockwork.echo_num(num));
  testTime('echo_str 1 char', () => clockwork.echo_str(singleCharStr));
  testTime('echo_str 100 chars', () => clockwork.echo_str(str));
  testTime('echo_str 10000 chars', () => clockwork.echo_str(longStr));
  testTime('echo_array 1 item', () => clockwork.echo_array(singleItemArr));
  testTime('echo_array 100 nums', () => clockwork.echo_array(arr));
  testTime('echo_array 10000 nums', () => clockwork.echo_array(longArr));
}
