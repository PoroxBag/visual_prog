import { expectType, expectError } from 'tsd';
import type { DeepReadonly, PickedByType, EventHandlers } from '../src/types.ts';

type Obj = { a: { b: number } };
declare const deepObj: DeepReadonly<Obj>;

expectType<number>(deepObj.a.b);

expectError(() => {
  // @ts-expect-error
  deepObj.a.b = 5;
});

type Mixed = {
  n: number;
  s: string;
  f: () => void;
};

type OnlyNumbers = PickedByType<Mixed, number>;
declare const numObj: OnlyNumbers;

expectType<number>(numObj.n);

expectError(() => {
  // @ts-expect-error
  numObj.s;
});

type Events = {
  click: { x: number; y: number };
  open: void;
};

type Handlers = EventHandlers<Events>;
declare const handlers: Handlers;

expectType<(payload: { x: number; y: number }) => void>(handlers.onClick);

expectError(() => {
  // @ts-expect-error
  handlers.onClick("wrong");
});