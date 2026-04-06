import { Task } from './Task.js';

export class TaskManager {
    constructor(storageKey = 'tasks') {
        this.storageKey = storageKey;
        this.tasks = this.load();
        this.currentFilter = 'all';
    }

    load() {
        const data = localStorage.getItem(this.storageKey);
        if (!data) return [];
        try {
            const plain = JSON.parse(data);
            return plain.map(taskData => Task.fromJSON(taskData));
        } catch {
            return [];
        }
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.tasks.map(t => t.toJSON())));
    }

    addTask(taskData) {
        const task = new Task(
            taskData.title,
            taskData.description,
            taskData.dueDate,
            taskData.reminderTime
        );
        this.tasks.push(task);
        this.save();
        return task;
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.save();
    }

    updateTask(id, newData) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.update(newData);
            this.save();
        }
    }

    toggleComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.toggleComplete();
            this.save();
        }
    }

    getFilteredTasks(filter = this.currentFilter) {
    let filtered;
    if (filter === 'active') {
        filtered = this.tasks.filter(t => !t.completed);
    } else if (filter === 'completed') {
        filtered = this.tasks.filter(t => t.completed);
    } else {
        filtered = [...this.tasks];
    }

    filtered.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }

        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : null;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : null;

        if (aDue !== null && bDue !== null) {
            return aDue - bDue; 
        }
        if (aDue !== null && bDue === null) return -1;
        if (aDue === null && bDue !== null) return 1;

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;
    }

    setFilter(filter) {
        this.currentFilter = filter;
    }

    getTasksDueToday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.tasks.filter(t => 
            t.dueDate && 
            new Date(t.dueDate) >= today && 
            new Date(t.dueDate) < tomorrow &&
            !t.completed
        );
    }
}