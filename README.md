# Immer-deps
Auto update dependencies, when immer's produce.

This providing way to manage `normalized (tree|graph) structure`.

Current status: API designing

# Conepts
- Strongly typed
- Keep immer's produce API
- Support tree and graph structure

# Why?
See below, Thats two state are same structure in mental model.

### 1. de-normalized tree state.
```ts
const state = {
  tasks: [{
    id: 1,
    name: 'task1',
    children: [{
      id: 2,
      name: 'task2',
      children: [{
        id: 3,
        name: 'task3'
      }]
    }]
  }]
};

const next = produce(state, draft => {
  draft.tasks.children[0].children[0].name = 'task3 - updated';
});

// `task1` updated. ✓
expect(next.tasks[0]).not.toEqual(state.tasks);
// `task2` updated. ✓
expect(next.tasks[0].children[0]).not.toEqual(state.tasks.children[0]);
// `task3` updated. ✓
expect(next.tasks[0].children[0].children[0]).not.toEqual(state.tasks.children[0].children[0]);
```

### 2. normalized tree state.
```ts
const state = {
  tasks: [
    { id: 1, name: 'task1', parentId: null },
    { id: 2, name: 'task2', parentId: 1 },
    { id: 3, name: 'task3', parentId: 2 }
  ]
};

const next = produce(state, draft => {
  draft.tasks[2].name = 'task3 - updated';
});

// `task1` updated. 💥
expect(next.tasks[0]).not.toEqual(state.tasks[0]);
// `task2` updated. 💥
expect(next.tasks[1]).not.toEqual(state.tasks[1]);
// `task3` updated. ✓
expect(next.tasks[2]).not.toEqual(state.tasks[2]);
```

`immer-deps` solve this mismatching in mental model.


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

# Todo
- Support immer's produce API
- Support environments without `Symbol`
- Support adding/deleting state
- Testing in real world apps

