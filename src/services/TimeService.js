export class TimeService {
    static async getCurrentTimeByIP() {
        try {
            const response = await fetch('https://time.akamai.com/?iso');
            if (!response.ok) throw new Error('Ошибка сети');
            const datetimeStr = await response.text();
            const datetime = new Date(datetimeStr);
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            console.log(' Время получено из внешнего API (Akamai)'); 
            return { datetime, timezone };
        } catch (error) {
            console.warn(' API времени недоступен, используем локальное время');
            return {
                datetime: new Date(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
        }
    }
}