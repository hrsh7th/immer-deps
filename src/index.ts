import { IProduce, Patch, PatchListener } from 'immer';
import { DeepPath, Prop } from './deep-path';

export type Define<State> = <Paths extends Prop[] = Prop[]>(...paths: Paths) => Definer<State, Paths>;
export type Definer<State, Paths extends Prop[]> = (resolver: Resolver<State, Paths>) => Definition<State, Paths>;
export type Definition<State, Paths extends Prop[]> = { path: Prop[]; resolver: Resolver<State, Paths> };
export type Resolver<State, Paths extends Prop[]> = (state: State, value: DeepPath<State, Paths>) => any[];

export function deps<State>(
  produce: IProduce,
  _deps: (define: Define<State>) => Definition<State, Prop[]>[]
) {
  //  const _definition = deps((...paths: Prop[]) => {
  //    return (resolver: Resolver<State, Prop[]>) => {
  //      return {
  //        paths: paths,
  //        resolver: resolver
  //      };
  //    }
  //  });

  return (state: State, recipe: (state: State) => void, patchListener?: PatchListener) => {
    const patches = [] as Patch[];
    const inversePatches = [] as Patch[];
    const current = produce(state, recipe, (patches_, inversePatches) => {
      patches.push(...patches_);
      inversePatches.push(...inversePatches);
    });
    patchListener && patchListener(patches, inversePatches)
    return current;
  };
}
