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

describe('basic', () => {

  it('tree structure', () => {
    const next = deps<State>(produce, define => ([

      define('tasks', Number)((state, task) => {
        return state.tasks.filter(t => t.id === task.parentId);
      })

    ]))(state, state => {
      state.tasks[1].name = 'task2 *';
    });
    expect(next.tasks[0]).toEqual(state.tasks[0]); // TODO: should not equals.
    expect(next.tasks[1]).not.toEqual(state.tasks[1]);
  });

});

