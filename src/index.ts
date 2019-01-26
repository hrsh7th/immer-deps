import { IProduce, Patch, PatchListener, isDraft } from 'immer';
import { DeepPath, Prop } from './deep-path';

export type Define<State> = <Paths extends Prop[] = Prop[]>(...paths: Paths) => Definer<State, Paths>;
export type Definer<State, Paths extends Prop[]> = (resolver: Resolver<State, Paths>) => Definition<State, Paths>;
export type Definition<State, Paths extends Prop[]> = { path: Prop[]; resolver: Resolver<State, Paths> };
export type Resolver<State, Paths extends Prop[]> = (state: State, value: DeepPath<State, Paths>) => any[];

type Context = {
  patches: Patch[];
  inversePatches: Patch[];
  markAsChangedValue: number;
};

const ImmerDepsMarkAsChangedSymbol = Symbol('immer-deps-mark-as-changed');

export function deps<State>(
  produce: IProduce,
  deps: (define: Define<State>) => Definition<State, Prop[]>[]
) {
  const definitions = deps((...path: Prop[]) => {
    return (resolver: Resolver<State, Prop[]>) => {
      return {
        path: path,
        resolver: resolver
      };
    }
  });

  return (state: State, recipe: (state: State) => void, patchListener?: PatchListener) => {
    if (isDraft(state)) {
      return produce(state, recipe, patchListener);
    }

    const context: Context = {
      patches: [],
      inversePatches: [],
      markAsChangedValue: Date.now()
    };

    const current = produce(state, recipe, (patches, inversePatches) => {
      context.patches.push(...patches);
      context.inversePatches.push(...inversePatches);
    });

    return produce(current, state => {
      definitions.forEach(definition => {
        context.patches.forEach(patch => {
          const path = matches(definition.path, patch.path);
          if (path.length) {
            const dependencies = definition.resolver(state as State, getIn(state, path));
            dependencies.forEach(dependency => {
              dependency[ImmerDepsMarkAsChangedSymbol] = context.markAsChangedValue;
            });
          }
        });
      });
    }, (patches, inversePatches) => {
      patchListener && patchListener(
        [...context.patches, ...patches],
        [...context.inversePatches, ...inversePatches]
      )
    });
  };

}

export function matches(matchers: Prop[], path: (keyof any)[]) {
  let isMatches = true;
  return matchers.reduce((matched, matcher, i) => {
    if (!isMatches) {
      return [];
    }

    if (
      (matcher === Number && typeof path[i] === 'number') ||
      (matcher === String && typeof path[i] === 'string') ||
      (matcher === path[i])
    ) {
      return [...matched, path[i]];
    } else {
      isMatches = false;
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
