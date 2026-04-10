import { TaskManager } from '../src/models/TaskManager.js';

describe('TaskManager', () => {
    let tm;

    beforeEach(() => {
        localStorage.clear();
        tm = new TaskManager();
    });

    test('addTask adds task and saves to localStorage', () => {
        tm.addTask({ title: 'Test' });
        expect(tm.tasks.length).toBe(1);
        const saved = JSON.parse(localStorage.getItem('tasks'));
        expect(saved.length).toBe(1);
        expect(saved[0].title).toBe('Test');
    });

    test('deleteTask removes task', () => {
        const task = tm.addTask({ title: 'To delete' });
        tm.deleteTask(task.id);
        expect(tm.tasks.length).toBe(0);
    });

    test('toggleComplete toggles completed status', () => {
        const task = tm.addTask({ title: 'Toggle' });
        tm.toggleComplete(task.id);
        expect(tm.tasks[0].completed).toBe(true);
        tm.toggleComplete(task.id);
        expect(tm.tasks[0].completed).toBe(false);
    });

    test('getFilteredTasks returns correct lists', () => {
        tm.addTask({ title: 'A' });
        const task2 = tm.addTask({ title: 'B' });
        tm.toggleComplete(task2.id);
        expect(tm.getFilteredTasks('all').length).toBe(2);
        expect(tm.getFilteredTasks('active').length).toBe(1);
        expect(tm.getFilteredTasks('completed').length).toBe(1);
    });

    test('getTasksDueToday returns tasks due today', () => {
        const today = new Date().toISOString().slice(0,10);
        const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0,10);
        tm.addTask({ title: 'Today', dueDate: today + 'T12:00' });
        tm.addTask({ title: 'Tomorrow', dueDate: tomorrow + 'T12:00' });
        expect(tm.getTasksDueToday().length).toBe(1);
        expect(tm.getTasksDueToday()[0].title).toBe('Today');
    });

    test('isOverdue возвращает true для просроченной задачи', () => {
        const task = tm.addTask({ title: 'Test', dueDate: '2020-01-01T12:00' });
        expect(tm.isOverdue(task)).toBe(true);
    });
});