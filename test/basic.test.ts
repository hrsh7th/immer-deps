import { produce } from 'immer';
import { deps } from '../src';

type State = {
  tasks: { id: number; name: string; parentId: number | null }[];
};

const state: State = {
  tasks: [
    { id: 0, name: 'task1', parentId: null },
    { id: 1, name: 'task2', parentId: 0 },
    { id: 2, name: 'task3', parentId: 3 },
    { id: 3, name: 'task4', parentId: 2 },
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
      const next = produceWithDeps(state, draft => {
        draft.tasks[1].name = 'task1 *';
      });
      expect(next.tasks[0]).not.toEqual(state.tasks[0]);
      expect(next.tasks[1]).not.toEqual(state.tasks[1]);
    });

    it('graph', () => {
      const next = produceWithDeps(state, draft => {
        draft.tasks[2].name = 'task2 *';
      });
      expect(next.tasks[2]).not.toEqual(state.tasks[2]);
      expect(next.tasks[3]).not.toEqual(state.tasks[3]);
    });

    it ('call twice', () => {
      const next1 = produceWithDeps(state, draft => {
        draft.tasks[1].name = 'task1 *';
      });
      expect(next1.tasks[0]).not.toEqual(state.tasks[0]);
      expect(next1.tasks[1]).not.toEqual(state.tasks[1]);

      const next2 = produceWithDeps(state, draft => {
        draft.tasks[1].name = 'task1 **';
      });
      expect(next2.tasks[0]).not.toEqual(next1.tasks[0]);
      expect(next2.tasks[1]).not.toEqual(next1.tasks[1]);
    });

  });

  describe('keep immer\'s api', () => {

    it('patches', () => {
      produceWithDeps(state, draft => {
        draft.tasks[1].name = 'task1 *';
      }, (patches, inversePatches) => {
        expect(patches).toHaveLength(1);
        expect(inversePatches).toHaveLength(1);
      });
    });

  });

});
