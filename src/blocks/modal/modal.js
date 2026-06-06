export class Modal {
    constructor(modalElement) {
        this.modal = modalElement;
        this.closeBtn = modalElement.querySelector('.modal__close');
        this.cancelBtn = document.getElementById('cancelModal');
        this.form = document.getElementById('taskForm');
        this.titleInput = document.getElementById('taskTitle');
        this.descInput = document.getElementById('taskDesc');
        this.dueDateInput = document.getElementById('taskDueDate');
        this.reminderInput = document.getElementById('taskReminder');
        this.taskIdInput = document.getElementById('taskId');
        this.modalTitle = document.getElementById('modalTitle');

        if (!this.taskIdInput) {
            this.taskIdInput = document.createElement('input');
            this.taskIdInput.type = 'hidden';
            this.taskIdInput.id = 'taskId';
            this.form.appendChild(this.taskIdInput);
        }

        this.initEvents();
    }

    // Локальная функция для преобразования ISO в ДД.ММ.ГГГГ ЧЧ:ММ
    isoToLocal(isoStr) {
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

    initEvents() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.cancelBtn.addEventListener('click', () => this.close());
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }

    open(mode = 'add', taskData = null) {
        this.modal.classList.add('modal--show');
        if (mode === 'add') {
            this.modalTitle.textContent = 'Новая задача';
            this.form.reset();
            this.taskIdInput.value = '';
            // Очищаем поля даты (на случай, если остались старые значения)
            if (this.dueDateInput) this.dueDateInput.value = '';
            if (this.reminderInput) this.reminderInput.value = '';
        } else if (mode === 'edit' && taskData) {
            this.modalTitle.textContent = 'Редактировать задачу';
            this.titleInput.value = taskData.title || '';
            this.descInput.value = taskData.description || '';
            // Преобразуем ISO в читаемый формат
            this.dueDateInput.value = taskData.dueDate ? this.isoToLocal(taskData.dueDate) : '';
            this.reminderInput.value = taskData.reminderTime ? this.isoToLocal(taskData.reminderTime) : '';
            this.taskIdInput.value = taskData.id;
        }
    }

    close() {
        this.modal.classList.remove('modal--show');
        setTimeout(() => this.form.reset(), 300);
    }

    getFormData() {
        return {
            id: this.taskIdInput.value || null,
            title: this.titleInput.value.trim(),
            description: this.descInput.value.trim(),
            dueDate: this.dueDateInput.value || null,
            reminderTime: this.reminderInput.value || null,
        };
    }
}