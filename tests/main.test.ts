// npx vitest --run
import { describe, it, expect } from 'vitest';
import {
  createUser,
  createBook,
  calculateArea,
  getStatusColor,
  capitalizeFirst,
  trimAndUppercase,
  getFirstElement,
  findById,
} from '../src/lib.js';

import type {
  User,
  Book,
  Status
} from '../src/lib.js';

describe('createUser', () => {
  it('creates user with email and default isActive true', () => {
    const u = createUser(1, 'Alice', 'a@a.com');
    expect(u).toEqual({ id: 1, name: 'Alice', email: 'a@a.com', isActive: true });
  });

  it('creates user without email and explicit isActive false', () => {
    const u = createUser(2, 'Bob', undefined, false);
    expect(u).toEqual({ id: 2, name: 'Bob', isActive: false });
    expect(u.email).toBeUndefined();
  });
});

describe('createBook', () => {
  it('returns the same book object', () => {
    const book: Book = { title: 'X', author: 'Y', genre: 'fiction', year: 2000 };
    expect(createBook(book)).toBe(book);
  });
});

describe('calculateArea', () => {
  it('calculates circle area', () => {
    expect(calculateArea('circle', 7)).toBeCloseTo(Math.PI * 49);
  });

  it('calculates square area', () => {
    expect(calculateArea('square', 3)).toBe(9);
  });
});

describe('getStatusColor', () => {
  it('maps statuses to colors', () => {
    expect(getStatusColor('active')).toBe('green');
    expect(getStatusColor('inactive')).toBe('yellow');
    expect(getStatusColor('new')).toBe('blue');
  });

  it('throws on unknown status', () => {
    expect(() => (getStatusColor as any)('unknown')).toThrow();
  });
});

describe('string formatters', () => {
  it('capitalizeFirst works', () => {
    expect(capitalizeFirst('hello')).toBe('Hello');
    expect(capitalizeFirst('hello', true)).toBe('HELLO');
    expect(capitalizeFirst('')).toBe('');
  });

  it('trimAndUppercase works', () => {
    expect(trimAndUppercase('  test  ')).toBe('test');
    expect(trimAndUppercase('  test  ', true)).toBe('TEST');
  });
});

describe('getFirstElement', () => {
  it('returns first or undefined', () => {
    expect(getFirstElement([1,2,3])).toBe(1);
    expect(getFirstElement([] as number[])).toBeUndefined();
  });
});

describe('findById', () => {
  it('finds by id', () => {
    const users: { id: number; name: string }[] = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' }
    ];
    expect(findById(users, 1)).toEqual({ id: 1, name: 'A' });
    expect(findById(users, 3)).toBeUndefined();
  });
});