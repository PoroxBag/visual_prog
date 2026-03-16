import type { Where, Sort, GroupBy, Having, Group } from './pipeline.js';

export const where = <T>(): Where<T> => {
  return <K extends keyof T>(key: K, value: T[K]) => {
    const fn = (data: T[]) => data.filter((item) => item[key] === value);
    return Object.assign(fn, { _where: true }) as typeof fn & { _where: true };
  };
};

export const sort = <T>(): Sort<T> => {
  return <K extends keyof T>(key: K) => {
    const fn = (data: T[]) =>
      [...data].sort((a, b) => {
        const av = a[key] as unknown as string | number;
        const bv = b[key] as unknown as string | number;
        if (av < bv) return -1;
        if (av > bv) return 1;
        return 0;
      });
    return Object.assign(fn, { _sort: true }) as typeof fn & { _sort: true };
  };
};

export const groupBy = <T>(): GroupBy<T> => {
  return <K extends keyof T>(key: K) => {
    const fn = (data: T[]) => {
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
    return Object.assign(fn, { _groupBy: true }) as typeof fn & { _groupBy: true };
  };
};

export const having = <T>(): Having<T> => {
  return <K extends keyof T>(predicate: (group: Group<T, K>) => boolean) => {
    const fn = (groups: Group<T, K>[]) => groups.filter(predicate);
    return Object.assign(fn, { _having: true }) as typeof fn & { _having: true };
  };
};