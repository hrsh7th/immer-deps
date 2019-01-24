# immer-deps.
auto update dependencies, when immer's produce.

# usage.

Current status: API designing

```ts
import { produce } from 'immer';

type Task = {
  id: number;
  name: string;
  parentId: number | null;
};

type State = {
  tasks: Task[];
};

const produce = deps<State>(produce, define => ([

  /**
   * You can define dependencies on part of state.
   */
  define('tasks', Number)((state, task) => {
    if (state.tasks[task.parentId]) {
      return [state.tasks[task.parentId]];
    }
    return [];
  })

]));

const state = {
  tasks: [
    { id: 1, name: 'todo1', parentId: null },
    { id: 1, name: 'todo1', parentId: 1 },
    { id: 1, name: 'todo1', parentId: 2 },
  ]
};

const next = produce(state, state => {
  state.tasks[2].name = 'todo3 - updated';
});

// `state.tasks[0]` was updated via dependent on `state.tasks[1]`.
// `state.tasks[1]` was updated via dependent on `state.tasks[2]`.
// `state.tasks[2]` was updated via it self`.
```

