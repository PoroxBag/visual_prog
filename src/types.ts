export type DeepReadonly<T> =
  T extends Function ? T :
  T extends Array<infer U> ? ReadonlyArray<DeepReadonly<U>> :
  T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } :
  T;

export type PickedByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K]
};

export type EventHandlers<T extends Record<string | number | symbol, any>> = {
  [K in keyof T as `on${Capitalize<string & K>}`]: (payload: T[K]) => void
};