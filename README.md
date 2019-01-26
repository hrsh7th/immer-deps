# Immer-deps
Auto update dependencies, when immer's produce.

This providing way to manage `normalized (tree|graph) structure`.

Current status: API designing

# Conepts
- Strongly typed
- Keep immer's produce API
- Support tree and graph structure

# Usage

```ts
import { produce } from 'immer';
import { deps } from 'immer-deps';

type State = {
  tasks: {
    id: number;
    name: string;
    parentId: number | null;
  }[];
};

/**
 * Wrap produce function.
 */
const produceWithDeps = deps<State>(produce, define => ([

  /**
   * Define dependencies on part of state.
   */
  define('tasks', Number)((state, task) => (
    state.tasks.filter(t => t.id === task.parentId
  ) /* will needs option here? */)

]));

const state: State = {
  tasks: [
    { id: 1, name: 'todo1', parentId: null },
    { id: 2, name: 'todo2', parentId: 1 },
    { id: 3, name: 'todo3', parentId: 2 },
  ]
};

const next = produceWithDeps(state, state => {
  state.tasks[2].name = 'todo3 - updated';
});

// `state.tasks[0]` was updated via dependent on `state.tasks[1]`.
// `state.tasks[1]` was updated via dependent on `state.tasks[2]`.
// `state.tasks[2]` was updated via it self`.
```

