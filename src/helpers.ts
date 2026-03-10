import type { Where, Sort, GroupBy, Having, Group } from './pipeline.js';

export const where = <T>(): Where<T> => {
  return <K extends keyof T>(key: K, value: T[K]) => (data: T[]) =>
    data.filter((item) => item[key] === value);
};

export const sort = <T>(): Sort<T> => {
  return <K extends keyof T>(key: K) => (data: T[]) =>
    [...data].sort((a, b) => {
      const av = a[key] as unknown as string | number;
      const bv = b[key] as unknown as string | number;
      if (av < bv) return -1;
      if (av > bv) return 1;
      return 0;
    });
};

export const groupBy = <T>(): GroupBy<T> => {
  return <K extends keyof T>(key: K) => (data: T[]) => {
    const acc = data.reduce((map: Record<string, Group<T, K>>, item) => {
      const k = String(item[key]);
      if (!map[k]) {
        map[k] = { key: item[key], items: [] };
      }
      map[k].items.push(item);
      return map;
    }, {} as Record<string, Group<T, K>>);
    return Object.values(acc);
  };
};

export const having = <T>(): Having<T> => {
  return <K extends keyof T>(predicate: (group: Group<T, K>) => boolean) =>
    (groups: Group<T, K>[]) =>
      groups.filter((g: Group<T, K>) => predicate(g));
};