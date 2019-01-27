import { IProduce, Patch, PatchListener } from 'immer';
import { v4 } from 'uuid';
import { DeepPath, Prop } from './deep-path';

export type Define<State> = <Paths extends Prop[] = Prop[]>(...paths: Paths) => Definer<State, Paths>;
export type Definer<State, Paths extends Prop[]> = (resolver: Resolve<State, Paths>) => Definition<State, Paths>;
export type Definition<State, Paths extends Prop[]> = { path: Prop[]; resolve: Resolve<State, Paths> };
export type Resolve<State, Paths extends Prop[]> = (state: State, value: DeepPath<State, Paths>) => any[];
export type Mutate<State> = (state: State) => void;

type Context = {
  markAsChanged: string;
  patches: Patch[];
  inversePatches: Patch[];
  visited: Visited;
};

const ImmerDepsMarkAsChangedSymbol = Symbol('immer-deps-mark-as-changed');

export function deps<State>(
  produce: IProduce,
  deps: (define: Define<State>) => Definition<State, Prop[]>[]
) {
  const definitions = deps((...path: Prop[]) => {
    return (resolve: Resolve<State, Prop[]>) => ({ path, resolve })
  });

  const produceWithDeps = (state: State, recipe: (state: State) => void, patchListener?: PatchListener): State => {
    const mutates = [] as Mutate<State>[];

    const next = produce(state, recipe, (patches, inversePatches) => {
      // @ts-ignore
      patches = patches.filter(patch => patch.path[patch.path.length - 1] !== ImmerDepsMarkAsChangedSymbol);
      // @ts-ignore
      inversePatches = inversePatches.filter(patch => patch.path[patch.path.length - 1] !== ImmerDepsMarkAsChangedSymbol);

      definitions.forEach(definition => {
        patches.forEach(patch => {
          const path = matches(definition.path, patch.path);
          if (path.length && !context.visited.has(path)) {
            context.visited.add(path);
            mutates.push(draft => {
              definition.resolve(draft, getIn(draft, path)).forEach(dependency => {
                dependency[ImmerDepsMarkAsChangedSymbol] = context.markAsChanged;
              });
            });
          }
        });
      });

      context.patches.push(...patches);
      context.inversePatches.push(...inversePatches);

      if (!mutates.length) {
        patchListener && patchListener(context.patches, context.inversePatches);
      }
    });

    if (mutates.length) {
      return produceWithDeps(next, draft => {
        mutates.forEach(mutate => mutate(draft));
      }, patchListener);
    }

    return next;
  };


  let context: Context;
  return (state: State, recipe: (state: State) => void, patchListener?: PatchListener): State => {
    context = {
      markAsChanged: v4(),
      patches: [],
      inversePatches: [],
      visited: new Visited()
    };
    return produceWithDeps(state, recipe, patchListener);
  };

}

export function matches(matchers: Prop[], path: (keyof any)[]) {
  let isMatch = true;
  return matchers.reduce((matched, matcher, i) => {
    if (!isMatch) {
      return [];
    }

    if (
      (matcher === Number && typeof path[i] === 'number') ||
      (matcher === path[i])
    ) {
      return [...matched, path[i]];
    } else {
      isMatch = false;
    }

    return [];
  }, [] as (keyof any)[]);
}

export function getIn(state: any, path: (keyof any)[]): any {
  const [head, ...tail] = path;
  if (tail.length) {
    return getIn(state[head], tail);
  }
  return state[head];
}

class Visited {
  private visited: { [key: string]: boolean } = {};

  public has(path: (keyof any)[]) {
    return !!this.visited[path.join('/')];
  }

  public add(path: (keyof any)[]) {
    this.visited[path.join('/')] = true;
  }
}

