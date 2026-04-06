import { NotificationService } from './NotificationService.js';

export class ReminderService {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.timeoutId = null;
        this.notifiedTaskIds = new Set();
    }

    start() {
        if (this.timeoutId) return;
        console.log('ReminderService запущен');
        this.checkReminders();
        this.scheduleCheck();
        setTimeout(() => this.checkReminders(), 1000);
    }

    scheduleCheck() {
        this.timeoutId = setTimeout(() => {
            this.checkReminders();
            this.scheduleCheck();
        }, 10000); 
    }

    stop() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    checkReminders() {
        const now = new Date();
        console.log('Проверка напоминаний в', now.toLocaleString());
        this.taskManager.tasks.forEach(task => {
            if (task.completed) return;
            let reminderTime = task.reminderTime;
            if (!reminderTime) return;
            if (typeof reminderTime === 'string') {
                reminderTime = new Date(reminderTime);
                task.reminderTime = reminderTime;
            }
            if (isNaN(reminderTime.getTime())) return;

            console.log(`  Задача "${task.title}": напоминание на ${reminderTime.toLocaleString()}`);
            if (reminderTime <= now && !this.notifiedTaskIds.has(task.id)) {
                console.log(` ОТПРАВЛЯЕМ уведомление для "${task.title}"`);
                NotificationService.notify('Напоминание о задаче', { body: task.title });
                this.notifiedTaskIds.add(task.id);
            }
        });
    }
    resetNotification(taskId) {
        this.notifiedTaskIds.delete(taskId);
    }
}