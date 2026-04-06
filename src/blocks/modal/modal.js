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
        } else if (mode === 'edit' && taskData) {
            this.modalTitle.textContent = 'Редактировать задачу';
            this.titleInput.value = taskData.title || '';
            this.descInput.value = taskData.description || '';
            this.dueDateInput.value = taskData.dueDate ? this.formatDateForInput(taskData.dueDate) : '';
            this.reminderInput.value = taskData.reminderTime ? this.formatDateForInput(taskData.reminderTime) : '';
            this.taskIdInput.value = taskData.id;
        }
    }

    close() {
        this.modal.classList.remove('modal--show');
        setTimeout(() => this.form.reset(), 300);
    }

    formatDateForInput(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
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