// npm run test:run npx vitest --ui
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs/promises', () => {
  return {
    readFile: vi.fn(),
    writeFile: vi.fn()
  };
});

import { readFile, writeFile } from 'node:fs/promises';
import { formatCSVFileToJSONFile } from '../src/csv.js';

const mockedRead = vi.mocked(readFile);
const mockedWrite = vi.mocked(writeFile);

describe('formatCSVFileToJSONFile', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('reads CSV, converts and writes JSON', async () => {
    const csvText = 'p1,p2\n1,hello\n2,world\n';
    mockedRead.mockResolvedValue(csvText);
    await formatCSVFileToJSONFile('/tmp/input.csv', '/tmp/out.json', ',');
    const expected = JSON.stringify([
      { p1: 1, p2: 'hello' },
      { p1: 2, p2: 'world' }
    ], null, 2);
    expect(mockedWrite).toHaveBeenCalledTimes(1);
    expect(mockedWrite).toHaveBeenCalledWith('/tmp/out.json', expected, 'utf8');
  });

  it('works with semicolon delimiter', async () => {
    const csvText = 'a; b\n3; foo\n';
    mockedRead.mockResolvedValue(csvText);
    await formatCSVFileToJSONFile('in.csv', 'out.json', ';');
    const expected = JSON.stringify([{ a: 3, b: 'foo' }], null, 2);
    expect(mockedWrite).toHaveBeenCalledWith('out.json', expected, 'utf8');
  });

  it('propagates readFile errors', async () => {
    mockedRead.mockRejectedValue(new Error('read failed'));
    await expect(formatCSVFileToJSONFile('in.csv', 'out.json', ',')).rejects.toThrow('read failed');
    expect(mockedWrite).not.toHaveBeenCalled();
  });
});