export class NotificationService {
    static history = [];

    static async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('Браузер не поддерживает уведомления');
            return false;
        }
        if (Notification.permission === 'granted') return true;
        if (Notification.permission === 'denied') return false;
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    static notify(title, options = {}, reminderTime = null) {
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, options);
            this.history.unshift({
                title,
                options,
                timestamp: new Date(),
                reminderTime: reminderTime ? new Date(reminderTime) : null
            });
            if (this.history.length > 10) this.history.pop();
            return notification;
        }
        return null;
    }

    static getHistory() {
        return this.history;
    }

    static clearHistory() {
        this.history = [];
    }
}