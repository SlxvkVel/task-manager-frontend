export class Task {
    constructor(title, description = '', dueDate = null, reminderTime = null) {
        this.id = Date.now() + Math.random().toString(36).substr(2, 5);
        this.title = title;
        this.description = description;

        if (dueDate) {
            const d = new Date(dueDate);
            this.dueDate = isNaN(d.getTime()) ? null : d;
        } else {
            this.dueDate = null;
        }

        if (reminderTime) {
            const d = new Date(reminderTime);
            this.reminderTime = isNaN(d.getTime()) ? null : d;
        } else {
            this.reminderTime = null;
        }

        this.completed = false;
        this.createdAt = new Date();
    }

    toggleComplete() {
        this.completed = !this.completed;
    }

    update(data) {
        if (data.title !== undefined) this.title = data.title;
        if (data.description !== undefined) this.description = data.description;
        if (data.dueDate !== undefined) {
            const d = new Date(data.dueDate);
            this.dueDate = isNaN(d.getTime()) ? null : d;
        }
        if (data.reminderTime !== undefined) {
            const d = new Date(data.reminderTime);
            this.reminderTime = isNaN(d.getTime()) ? null : d;
        }
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            dueDate: this.dueDate ? this.dueDate.toISOString() : null,
            reminderTime: this.reminderTime ? this.reminderTime.toISOString() : null,
            completed: this.completed,
            createdAt: this.createdAt.toISOString(),
        };
    }

    static fromJSON(json) {
    const task = new Task(json.title, json.description);
    task.id = json.id;
    task.completed = json.completed;
    task.createdAt = json.createdAt ? new Date(json.createdAt) : new Date();
    if (json.dueDate) {
        const d = new Date(json.dueDate);
        task.dueDate = isNaN(d.getTime()) ? null : d;
    } else {
        task.dueDate = null;
    }
    if (json.reminderTime) {
        const d = new Date(json.reminderTime);
        task.reminderTime = isNaN(d.getTime()) ? null : d;
    } else {
        task.reminderTime = null;
    }
    return task;
    }
}