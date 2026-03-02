export function csvToJSON(input: string[], delimiter: string): object[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error('Input must be a non-empty array of strings');
  }

  const headerLine = input[0];
  if (headerLine === undefined) {
    throw new Error('Header line is missing');
}

const rows = input.slice(1);

  const headers = headerLine.split(delimiter).map(h => h.trim());

  if (headers.some(h => h === '')) {
    throw new Error('Empty header name found');
  }

  const result: object[] = [];

  for (const row of rows) {
    const cols = row.split(delimiter);

    if (cols.length !== headers.length) {
      throw new Error('Row has different number of columns than header');
    }

    const obj: Record<string, unknown> = {};

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const col = cols[i];

      if (header === undefined || col === undefined) {
        throw new Error('Unexpected undefined column');
      }

      const raw = col.trim();

      const isNumber = /^-?\d+(\.\d+)?$/.test(raw);
      const value = isNumber ? Number(raw) : raw;

      obj[header] = value;
    }

    result.push(obj);
  }

  return result;
}

import { readFile, writeFile } from 'node:fs/promises';

export async function formatCSVFileToJSONFile(input: string, output: string, delimiter: string): Promise<void> {
  if (!input || !output) {
    throw new Error('Input and output paths are required');
  }
  const raw = await readFile(input, 'utf8');
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const json = csvToJSON(lines, delimiter);
  const outStr = JSON.stringify(json, null, 2);
  await writeFile(output, outStr, 'utf8');
}