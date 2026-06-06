import { TaskManager } from './models/TaskManager.js';
import { ReminderService } from './services/ReminderService.js';
import { NotificationService } from './services/NotificationService.js';
import { TimeService } from './services/TimeService.js';
import { createTaskCard } from './blocks/task-card/task-card.js';
import { Modal } from './blocks/modal/modal.js';

// ========== Утилиты для работы с датой (формат ДД.ММ.ГГГГ ЧЧ:ММ) ==========
// Преобразование из формата ДД.ММ.ГГГГ ЧЧ:ММ в ISO (ГГГГ-ММ-ДДTЧЧ:ММ)
function localToISO(localStr) {
    if (!localStr) return null;
    const match = localStr.match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/);
    if (!match) return null;
    const [_, day, month, year, hour, minute] = match;
    return `${year}-${month}-${day}T${hour}:${minute}`;
}

// Преобразование из ISO в формат ДД.ММ.ГГГГ ЧЧ:ММ
function isoToLocal(isoStr) {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Маска ввода для полей даты
function setupDateMask(inputElement) {
    if (!inputElement) return;

    inputElement.addEventListener('input', function(e) {
        let value = this.value.replace(/[^\d]/g, '');
        if (value.length > 14) value = value.slice(0, 14); // максимум 14 цифр

        let formatted = '';
        if (value.length >= 2) {
            formatted += value.slice(0, 2);
            if (value.length >= 4) {
                formatted += '.' + value.slice(2, 4);
                if (value.length >= 8) {
                    formatted += '.' + value.slice(4, 8);
                    if (value.length >= 10) {
                        formatted += ' ' + value.slice(8, 10);
                        if (value.length >= 12) {
                            formatted += ':' + value.slice(10, 12);
                            if (value.length > 12) formatted += value.slice(12);
                        } else if (value.length > 10) {
                            formatted += ':' + value.slice(10);
                        }
                    } else if (value.length > 8) {
                        formatted += ' ' + value.slice(8);
                    }
                } else if (value.length > 4) {
                    formatted += '.' + value.slice(4);
                }
            } else if (value.length > 2) {
                formatted += '.' + value.slice(2);
            }
        } else {
            formatted = value;
        }
        this.value = formatted;
    });

    inputElement.addEventListener('blur', function() {
        const val = this.value;
        if (val && !/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/.test(val)) {
            alert('Неверный формат. Ожидается: ДД.ММ.ГГГГ ЧЧ:ММ (год – 4 цифры)');
            this.value = '';
        }
    });
}
// =======================================================================

(async function init() {
    await NotificationService.requestPermission();

    const taskManager = new TaskManager();
    const reminderService = new ReminderService(taskManager);
    reminderService.start();

    const taskListEl = document.getElementById('tasksList');
    const tasksPage = document.getElementById('tasksPage');
    const statsPage = document.getElementById('statsPage');
    const remindersPage = document.getElementById('remindersPage');
    const navBtns = document.querySelectorAll('.nav-btn');
    const filterBtns = document.querySelectorAll('.filters__btn');
    const addBtn = document.getElementById('addTaskBtn');
    const modal = new Modal(document.getElementById('taskModal'));
    const reminderFullListEl = document.getElementById('remindersFullList');
    const statsGrid = document.getElementById('statsGrid');

    // Применяем маску к полям даты
    const dueDateInput = document.getElementById('taskDueDate');
    const reminderInput = document.getElementById('taskReminder');
    setupDateMask(dueDateInput);
    setupDateMask(reminderInput);

    let clockInterval = null;

    function startLiveClock(serverDateTime, timezone) {
        if (clockInterval) clearInterval(clockInterval);
        const serverTime = new Date(serverDateTime);
        const localTime = new Date();
        const offset = serverTime.getTime() - localTime.getTime();

        function updateClock() {
            const now = new Date();
            const adjustedTime = new Date(now.getTime() + offset);
            document.getElementById('live-clock').textContent = adjustedTime.toLocaleTimeString();
            const tzEl = document.getElementById('timezone-info');
            if (tzEl && tzEl.textContent === '') {
                tzEl.textContent = `Часовой пояс: ${timezone}`;
            }
        }

        updateClock();
        clockInterval = setInterval(updateClock, 1000);
    }

    async function loadAndDisplayTime() {
        const clockEl = document.getElementById('live-clock');
        if (!clockEl) return;
        const timeInfo = await TimeService.getCurrentTimeByIP();
        if (timeInfo.error) {
            clockEl.textContent = 'Ошибка';
            const tzEl = document.getElementById('timezone-info');
            if (tzEl) tzEl.textContent = timeInfo.error;
            return;
        }
        startLiveClock(timeInfo.datetime, timeInfo.timezone);
    }

    function renderStatsChart(completed, total) {
        const canvas = document.getElementById('statsChart');
        const percentDiv = document.getElementById('statsChartPercent');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        const cx = w / 2, cy = h / 2;
        const radius = Math.min(w, h) / 2 - 5;

        ctx.clearRect(0, 0, w, h);

        if (total === 0) {
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#6c757d';
            ctx.textAlign = 'center';
            ctx.fillText('Нет задач', cx, cy);
            if (percentDiv) percentDiv.textContent = '';
            return;
        }

        const percent = Math.round((completed / total) * 100);
        const angle = (percent / 100) * 2 * Math.PI;
        const start = -Math.PI / 2;
        const end = start + angle;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#e9ecef';
        ctx.fill();

        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, start, end);
        ctx.fillStyle = '#4a6fa5';
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.beginPath();
        ctx.arc(cx, cy, radius - 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius - 2, start, end);
        ctx.fillStyle = '#4a6fa5';
        ctx.fill();

        if (percentDiv) percentDiv.textContent = `${percent}% выполнено`;
    }

    function renderStats() {
        const tasks = taskManager.tasks;
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const active = total - completed;
        statsGrid.innerHTML = `
            <div class="stat-card"><div class="stat-card__title">Всего задач</div><div class="stat-card__value">${total}</div></div>
            <div class="stat-card"><div class="stat-card__title">Выполнено</div><div class="stat-card__value">${completed}</div></div>
            <div class="stat-card"><div class="stat-card__title">Активных</div><div class="stat-card__value">${active}</div></div>
        `;
        renderStatsChart(completed, total);
    }

    function refreshUI() {
        renderTasks();
        renderRemindersFull();
        renderStats();
    }

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            navBtns.forEach(b => b.classList.remove('nav-btn--active'));
            btn.classList.add('nav-btn--active');
            [tasksPage, statsPage, remindersPage].forEach(p => p.classList.remove('page--active'));
            if (page === 'tasks') {
                tasksPage.classList.add('page--active');
                loadAndDisplayTime();
            } else if (page === 'stats') {
                statsPage.classList.add('page--active');
                renderStats();
            } else if (page === 'reminders') {
                remindersPage.classList.add('page--active');
                renderRemindersFull();
            }
        });
    });

    function renderTasks() {
        const tasks = taskManager.getFilteredTasks();
        taskListEl.innerHTML = '';
        tasks.forEach(task => {
            const card = createTaskCard(
                task,
                id => {
                    taskManager.toggleComplete(id);
                    reminderService.resetNotification(id);
                    refreshUI();
                },
                task => modal.open('edit', task),
                id => {
                    if (confirm('Удалить задачу?')) {
                        taskManager.deleteTask(id);
                        reminderService.resetNotification(id);
                        refreshUI();
                    }
                }
            );
            if (taskManager.isOverdue(task)) {
                card.classList.add('task-card--overdue');
            }
            taskListEl.appendChild(card);
        });
    }

    function renderRemindersFull() {
        const tasksWithReminder = taskManager.tasks.filter(t => t.reminderTime && !t.completed);
        tasksWithReminder.sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime));
        reminderFullListEl.innerHTML = '';
        if (tasksWithReminder.length === 0) {
            reminderFullListEl.innerHTML = '<p class="reminder-item">Нет активных напоминаний</p>';
            return;
        }
        tasksWithReminder.forEach(task => {
            const item = document.createElement('div');
            item.className = 'reminder-item';
            item.innerHTML = `
                <div class="reminder-item__info">
                    <span class="reminder-item__title">${escapeHtml(task.title)}</span>
                    <span class="reminder-item__time">${new Date(task.reminderTime).toLocaleString()}</span>
                </div>
                <span class="reminder-item__status">Активно</span>
                <div class="reminder-item__actions">
                    <button class="reminder-item__btn edit-reminder-btn" data-id="${task.id}"><i class="fas fa-pen"></i></button>
                    <button class="reminder-item__btn delete-reminder-btn" data-id="${task.id}"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            reminderFullListEl.appendChild(item);
        });

        reminderFullListEl.querySelectorAll('.edit-reminder-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const task = taskManager.tasks.find(t => t.id === id);
                if (task) modal.open('edit', task);
            });
        });
        reminderFullListEl.querySelectorAll('.delete-reminder-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (confirm('Удалить напоминание?')) {
                    taskManager.deleteTask(id);
                    reminderService.resetNotification(id);
                    refreshUI();
                }
            });
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('filters__btn--active'));
            btn.classList.add('filters__btn--active');
            taskManager.setFilter(btn.dataset.filter);
            renderTasks();
        });
    });

    addBtn.addEventListener('click', () => modal.open('add'));

    document.getElementById('taskForm').addEventListener('submit', e => {
        e.preventDefault();
        const data = modal.getFormData(); // поля уже в формате ДД.ММ.ГГГГ ЧЧ:ММ

        // Конвертируем в ISO для валидации и хранения
        let dueDateISO = null;
        let reminderISO = null;
        if (data.dueDate) {
            dueDateISO = localToISO(data.dueDate);
            if (!dueDateISO) {
                alert('Неверный формат даты срока выполнения. Ожидается ДД.ММ.ГГГГ ЧЧ:ММ');
                return;
            }
        }
        if (data.reminderTime) {
            reminderISO = localToISO(data.reminderTime);
            if (!reminderISO) {
                alert('Неверный формат даты напоминания. Ожидается ДД.ММ.ГГГГ ЧЧ:ММ');
                return;
            }
        }

        // Валидация
        if (!data.title.trim()) {
            alert('Введите название задачи');
            return;
        }
        if (!dueDateISO) {
            alert('Укажите срок выполнения');
            return;
        }

        const dueDateObj = new Date(dueDateISO);
        if (isNaN(dueDateObj.getTime())) {
            alert('Некорректная дата. Проверьте день, месяц, год (4 цифры)');
            return;
        }
        if (dueDateObj < new Date()) {
            alert('Срок выполнения не может быть в прошлом');
            return;
        }

        // Сохраняем ISO-строки
        data.dueDate = dueDateISO;
        data.reminderTime = reminderISO;

        if (data.id) {
            taskManager.updateTask(data.id, {
                title: data.title,
                description: data.description,
                dueDate: data.dueDate,
                reminderTime: data.reminderTime
            });
            reminderService.resetNotification(data.id);
        } else {
            taskManager.addTask(data);
        }
        modal.close();
        refreshUI();
    });

    document.getElementById('githubLink').addEventListener('click', e => {
        e.preventDefault();
        window.open('https://github.com/SlxvkVel/task-manager-frontend', '_blank');
    });

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    renderTasks();
    renderStats();
    renderRemindersFull();
    if (tasksPage.classList.contains('page--active')) {
        loadAndDisplayTime();
    }
})();