import { TaskManager } from './models/TaskManager.js';
import { ReminderService } from './services/ReminderService.js';
import { NotificationService } from './services/NotificationService.js';
import { TimeService } from './services/TimeService.js';
import { createTaskCard } from './blocks/task-card/task-card.js';
import { Modal } from './blocks/modal/modal.js';

(async function init() {
    await NotificationService.requestPermission();

    const taskManager = new TaskManager();
    const reminderService = new ReminderService(taskManager);
    reminderService.start();

    // DOM элементы
    const taskListEl = document.getElementById('tasksList');
    const tasksPage = document.getElementById('tasksPage');
    const statsPage = document.getElementById('statsPage');
    const remindersPage = document.getElementById('remindersPage');
    const navBtns = document.querySelectorAll('.nav-btn');
    const filterBtns = document.querySelectorAll('.filters__btn');
    const addBtn = document.getElementById('addTaskBtn');
    const modalElement = document.getElementById('taskModal');
    const reminderFullListEl = document.getElementById('remindersFullList');
    const statsGrid = document.getElementById('statsGrid');

    const modal = new Modal(modalElement);


    let clockInterval = null;

    function startLiveClock(serverDateTime, timezone) {
        if (clockInterval) clearInterval(clockInterval);
        const serverTime = new Date(serverDateTime);
        const localTime = new Date();
        const offset = serverTime.getTime() - localTime.getTime();

     function updateClock() {
        const now = new Date();
        const adjustedTime = new Date(now.getTime() + offset);
        const timeString = adjustedTime.toLocaleTimeString();
        const clockElement = document.getElementById('live-clock');
        const tzElement = document.getElementById('timezone-info');
        if (clockElement) clockElement.textContent = timeString;
        if (tzElement && tzElement.textContent === '') {
            tzElement.textContent = `Часовой пояс: ${timezone}`;
        }
    }

     updateClock();
     clockInterval = setInterval(updateClock, 1000);
    }

    async function loadAndDisplayTime() {
    const clockElement = document.getElementById('live-clock');
    if (!clockElement) return;

    const timeInfo = await TimeService.getCurrentTimeByIP();
    if (timeInfo.error) {
        clockElement.textContent = 'Ошибка';
        const tzElement = document.getElementById('timezone-info');
        if (tzElement) tzElement.textContent = timeInfo.error;
        return;
    }
    startLiveClock(timeInfo.datetime, timeInfo.timezone);
    }


    function renderStatsChart(completed, total) {
        const canvas = document.getElementById('statsChart');
        const percentDiv = document.getElementById('statsChartPercent');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = 200;
        const height = 200;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 5;

        ctx.clearRect(0, 0, width, height);

        if (total === 0) {
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#6c757d';
            ctx.textAlign = 'center';
            ctx.fillText('Нет задач', centerX, centerY);
            if (percentDiv) percentDiv.textContent = '';
            return;
        }

        const percent = Math.round((completed / total) * 100);
        const completedAngle = (percent / 100) * 2 * Math.PI;
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + completedAngle;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#e9ecef';
        ctx.fill();

        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.fillStyle = '#4a6fa5';
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius - 2, startAngle, endAngle);
        ctx.fillStyle = '#4a6fa5';
        ctx.fill();

        if (percentDiv) {
            percentDiv.textContent = `${percent}% выполнено`;
        }
    }

    function renderStats() {
        const tasks = taskManager.tasks;
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const active = tasks.filter(t => !t.completed).length;
        const withReminder = tasks.filter(t => t.reminderTime).length;
        statsGrid.innerHTML = `
            <div class="stat-card"><div class="stat-card__title">Всего задач</div><div class="stat-card__value">${total}</div></div>
            <div class="stat-card"><div class="stat-card__title">Выполнено</div><div class="stat-card__value">${completed}</div></div>
            <div class="stat-card"><div class="stat-card__title">Активных</div><div class="stat-card__value">${active}</div></div>
            <div class="stat-card"><div class="stat-card__title">С напоминаниями</div><div class="stat-card__value">${withReminder}</div></div>
        `;
        renderStatsChart(completed, total);
    }

    // Переключение страниц
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            navBtns.forEach(b => b.classList.remove('nav-btn--active'));
            btn.classList.add('nav-btn--active');
            [tasksPage, statsPage, remindersPage].forEach(p => p.classList.remove('page--active'));
            if (page === 'tasks') {
                tasksPage.classList.add('page--active');
                loadAndDisplayTime(); 
            }
            if (page === 'stats') {
                statsPage.classList.add('page--active');
                renderStats();
            }
            if (page === 'reminders') {
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
                (id) => {
                    taskManager.toggleComplete(id);
                    reminderService.resetNotification(id);
                    renderTasks();
                    renderRemindersFull();
                    renderStats();
                },
                (task) => modal.open('edit', task),
                (id) => {
                    if (confirm('Удалить задачу?')) {
                        taskManager.deleteTask(id);
                        reminderService.resetNotification(id);
                        renderTasks();
                        renderRemindersFull();
                        renderStats();
                    }
                }
            );
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
                    <button class="reminder-item__btn edit-reminder-btn" data-id="${task.id}">✎</button>
                    <button class="reminder-item__btn delete-reminder-btn" data-id="${task.id}">🗑</button>
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
                    renderRemindersFull();
                    renderTasks();
                    renderStats();
                }
            });
        });
    }

    // Фильтры
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('filters__btn--active'));
            btn.classList.add('filters__btn--active');
            const filter = btn.dataset.filter;
            taskManager.setFilter(filter);
            renderTasks();
        });
    });

    addBtn.addEventListener('click', () => modal.open('add'));

    document.getElementById('taskForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const data = modal.getFormData();
        if (data.id) {
            taskManager.updateTask(data.id, {
                title: data.title,
                description: data.description,
                dueDate: data.dueDate,
                reminderTime: data.reminderTime,
            });
            reminderService.resetNotification(data.id);
        } else {
            taskManager.addTask(data);
        }
        modal.close();
        renderTasks();
        renderRemindersFull();
        renderStats();
    });

    document.getElementById('githubLink').addEventListener('click', (e) => {
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