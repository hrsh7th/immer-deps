import { produce } from 'immer';
import { deps } from '../src';

type State = {
  tasks: { id: number; name: string; parentId: number | null }[];
};

const state: State = {
  tasks: [
    { id: 1, name: 'task1', parentId: null },
    { id: 2, name: 'task2', parentId: 1 },
  ]
};

const produceWithDeps = deps<State>(produce, define => ([

  define('tasks', Number)((state, task) => {
    return state.tasks.filter(t => t.id === task.parentId);
  })

]));


describe('basic', () => {

  describe('automatic update dependent values', () => {

    it('tree', () => {
      const next = produceWithDeps(state, state => {
        state.tasks[1].name = 'task2 *';
      });
      expect(next.tasks[0]).not.toEqual(state.tasks[0]);
      expect(next.tasks[1]).not.toEqual(state.tasks[1]);
    })

  });

  describe('keep immer\'s api', () => {

    it('patches', () => {
      produceWithDeps(state, state => {
        state.tasks[1].name = 'task2 *';
      }, (patches, inversePatches) => {
        expect(patches).toHaveLength(2);
        expect(inversePatches).toHaveLength(2);
      });
    });

  });

});
