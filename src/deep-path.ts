export type Prop = keyof any | StringConstructor | NumberConstructor;

type PropType<P extends Prop> = P extends NumberConstructor ? number : P extends StringConstructor ? string : P;

type Head<U> = U extends [any, ...any[]]
  ? ((...args: U) => any) extends (head: infer H, ...args: any) => any
    ? H
    : never
  : never;

type Tail<U> = U extends [any, any, ...any[]]
  ? ((...args: U) => any) extends (head: any, ...args: infer T) => any
    ? T
    : never
  : never;

export type DeepPath<State extends any, T extends Prop[]> = T extends keyof State
  ? {
      0: State[PropType<Head<T>>];
      1: DeepPath<State[PropType<Head<T>>], Tail<T>>;
    }[Tail<T> extends never ? 0 : 1]
  : never;

