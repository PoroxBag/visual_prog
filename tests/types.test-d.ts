import { expectType, expectError } from 'tsd';
import type { DeepReadonly, PickedByType, EventHandlers } from '../src/types.ts';

type Obj = { a: { b: number } };

declare const obj: DeepReadonly<Obj>;

expectType<number>(obj.a.b);

expectError(obj.a.b = 5);

type Mixed = {
  n: number;
  s: string;
  f: () => void;
};

type OnlyNumbers = PickedByType<Mixed, number>;

declare const numObj: OnlyNumbers;

expectType<number>(numObj.n);

expectError(numObj.s);

type Events = {
  click: { x: number };
  open: void;
};

type Handlers = EventHandlers<Events>;

declare const handlers: Handlers;

expectType<(payload: { x: number }) => void>(handlers.onClick);

expectError(handlers.onClick("wrong"));