import { describe, it, expect } from 'vitest';
import { csvToJSON } from '../src/csv.js';

describe('csvToJSON', () => {
  it('parses simple csv with semicolon delimiter and converts numeric values', () => {
    const input = [
      'p1;p2;p3;p4',
      '1;A;b;c',
      '2;B;v;d'
    ];
    const res = csvToJSON(input, ';');
    expect(res).toEqual([
      { p1: 1, p2: 'A', p3: 'b', p4: 'c' },
      { p1: 2, p2: 'B', p3: 'v', p4: 'd' }
    ]);
  });

  it('parses floats and negative numbers', () => {
    const input = [
      'a;b',
      '-3.5;hello',
      '4;world'
    ];
    const res = csvToJSON(input, ';');
    expect(res).toEqual([
      { a: -3.5, b: 'hello' },
      { a: 4, b: 'world' }
    ]);
  });

  it('throws if a row has different number of columns', () => {
    const input = [
      'a;b;c',
      '1;2'
    ];
    expect(() => csvToJSON(input, ';')).toThrow('Row has different number of columns than header');
  });

  it('throws on empty input array', () => {
    expect(() => csvToJSON([], ',')).toThrow('Input must be a non-empty array of strings');
  });

  it('trims headers and values and preserves column order', () => {
    const input = [
      '  x  ,  y ',
      '  10  ,  foo ',
    ];
    const res = csvToJSON(input, ',');
    expect(res).toEqual([{ x: 10, y: 'foo' }]);
  });
});