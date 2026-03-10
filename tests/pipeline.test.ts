import { describe, it, expect } from 'vitest';
import { query } from '../src/pipeline.js';
import type { Group } from '../src/pipeline.js';

import { where as whereBuilder, sort as sortBuilder, groupBy as groupByBuilder, having as havingBuilder } from '../src/helpers.js';

type User = {
  id: number;
  name: string;
  surname: string;
  age: number;
  city: string;
};

const users: User[] = [
  { id: 1, name: 'John', surname: 'Doe', age: 34, city: 'NY' },
  { id: 2, name: 'John', surname: 'Doe', age: 33, city: 'NY' },
  { id: 3, name: 'John', surname: 'Doe', age: 35, city: 'LA' },
  { id: 4, name: 'Mike', surname: 'Doe', age: 35, city: 'LA' },
];

describe('pipeline basics', () => {
  it('filters by name and surname and sorts by age', () => {
    const where = whereBuilder<User>();
    const sort = sortBuilder<User>();

    const search = query(
      where('name', 'John'),
      where('surname', 'Doe'),
      sort('age'),
    );

    const result = search(users);
    expect(result.map(u => u.id)).toEqual([2, 1, 3]);
    expect(result).toEqual([
      { id: 2, name: 'John', surname: 'Doe', age: 33, city: 'NY' },
      { id: 1, name: 'John', surname: 'Doe', age: 34, city: 'NY' },
      { id: 3, name: 'John', surname: 'Doe', age: 35, city: 'LA' },
    ]);
  });

  it('groups by city and keeps only groups with more than 1 item', () => {
    const groupBy = groupByBuilder<User>();
    const having = havingBuilder<User>();

    const pipeline = query(
      groupBy('city'),
      having((g) => g.items.length > 1),
    );

    const res = pipeline(users);
    expect(res.length).toBe(2);
    const keys = (res as Group<User, keyof User>[]).map(g => String(g.key)).sort();
    expect(keys).toEqual(['LA', 'NY']);
  });

  it('combined pipeline: where -> groupBy -> having', () => {
    const where = whereBuilder<User>();
    const groupBy = groupByBuilder<User>();
    const having = havingBuilder<User>();

    const pipeline = query(
      where('surname', 'Doe'),
      groupBy('city'),
      having((group) => group.items.some(u => u.age > 34)),
    );

    const res = pipeline(users);
    expect(res.length).toBe(1);
    expect(res[0].key).toBe('LA');
    expect(res[0].items.some((u: User) => u.age > 34)).toBe(true);
  });
});