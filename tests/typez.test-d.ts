import type { DeepReadonly, PickedByType, EventHandlers } from '../src/types.js';

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;

type Assert<T extends true> = T;

type Orig1 = {
  a: {
    b: number;
    c: string[];
  };
  d: () => number;
};

type Deeped1 = DeepReadonly<Orig1>;
type ExpectedDeeped1 = {
  readonly a: {
    readonly b: number;
    readonly c: readonly string[];
  };
  readonly d: () => number;
};

type Test_DeepReadonly = Assert<Equals<Deeped1, ExpectedDeeped1>>;

type Orig2 = string[];
type Test_DeepReadonly2 = Assert<Equals<DeepReadonly<Orig2>, readonly string[]>>;

type Mixed = {
  n: number;
  s: string;
  f: () => void;
  n2: number;
  arr: number[];
};

type PickedNumbers = PickedByType<Mixed, number>;
type ExpectedPickedNumbers = {
  n: number;
  n2: number;
};
type Test_PickedByType = Assert<Equals<PickedNumbers, ExpectedPickedNumbers>>;

type PickedFns = PickedByType<Mixed, () => void>;
type ExpectedPickedFns = { f: () => void };
type Test_PickedByTypeFns = Assert<Equals<PickedFns, ExpectedPickedFns>>;

type Events = {
  click: { x: number; y: number };
  open: void;
  close: string;
  'user:login': { id: string };
};

type Handlers = EventHandlers<Events>;

type ExpectedHandlers = {
  onClick: (payload: { x: number; y: number }) => void;
  onOpen: (payload: void) => void;
  onClose: (payload: string) => void;
  'onUser:login': (payload: { id: string }) => void;
};

type Test_EventHandlers_keys =
  Assert<Equals<keyof Handlers, keyof ExpectedHandlers>>;

type Test_EventHandlers_shapes =
  Assert<Equals<Handlers['onClick'], (payload: { x: number; y: number }) => void>> &
  Assert<Equals<Handlers['onOpen'], (payload: void) => void>> &
  Assert<Equals<Handlers['onClose'], (payload: string) => void>> &
  Assert<Equals<Handlers['onUser:login'], (payload: { id: string }) => void>>;


type FinalCheck = Test_EventHandlers_keys & Test_EventHandlers_shapes;