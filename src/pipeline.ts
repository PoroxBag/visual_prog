export type Transform<T> = (data: T[]) => T[];

export type Where<T> = <K extends keyof T>(key: K, value: T[K]) => Transform<T> & { _where: true };
export type Sort<T> = <K extends keyof T>(key: K) => Transform<T> & { _sort: true };

export type Group<T, K extends keyof T> = {
  key: T[K];
  items: T[];
};

export type GroupBy<T> = <K extends keyof T>(key: K) => ((data: T[]) => Group<T, K>[]) & { _groupBy: true };
export type Having<T> = <K extends keyof T>(
  predicate: (group: Group<T, K>) => boolean
) => ((groups: Group<T, K>[]) => Group<T, K>[]) & { _having: true };

type Phase = 0 | 1 | 2 | 3;

type GetPhase<Step> =
  Step extends { _where: any } ? 0 :
  Step extends { _groupBy: any } ? 1 :
  Step extends { _having: any } ? 2 :
  Step extends { _sort: any } ? 3 :
  never;

type AllowedNext<P extends Phase> =
  P extends 0 ? 0 | 1 | 2 | 3 :
  P extends 1 ? 1 | 2 | 3 :
  P extends 2 ? 2 | 3 :
  3;

type CheckOrder<Steps extends any[], Prev extends Phase = 0> =
  Steps extends [infer First, ...infer Rest]
    ? GetPhase<First> extends infer P
      ? P extends Phase
        ? P extends AllowedNext<Prev>
          ? CheckOrder<Rest, P>
          : false
        : false
      : false
    : true;

type ValidateOrder<Steps extends any[]> =
  CheckOrder<Steps> extends true ? Steps : never;

type LastReturn<T, Steps extends any[]> =
  Steps extends [] ? T[] :
  Steps extends [...any[], infer Last] ? (Last extends (...args: any) => infer R ? R : never) :
  never;

export function query<T, Steps extends any[]>(
  ...steps: Steps & ValidateOrder<Steps>
): (data: T[]) => LastReturn<T, Steps> {
  return (data: T[]) => {
    let acc: any = data;
    for (const step of steps) {
      acc = (step as (arg: any) => any)(acc);
    }
    return acc;
  };
}