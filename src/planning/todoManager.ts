export type TodoStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

export interface TodoItem {
  id: string;
  text: string;
  status: TodoStatus;
}

export class TodoManager {
  private todos: TodoItem[] = [];

  add(text: string): TodoItem {
    const todo: TodoItem = {
      id: Math.random().toString(36).substring(7),
      text,
      status: 'pending'
    };
    this.todos.push(todo);
    return todo;
  }

  updateStatus(id: string, status: TodoStatus): boolean {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.status = status;
      return true;
    }
    return false;
  }

  list(): TodoItem[] {
    return [...this.todos];
  }
}
