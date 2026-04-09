export function createTaskCard(task, onToggle, onEdit, onDelete) {
    const card = document.createElement('div');
    card.className = `task-card ${task.completed ? 'task-card--completed' : ''}`;
    card.dataset.id = task.id;

    const title = document.createElement('h3');
    title.className = 'task-card__title';
    title.textContent = task.title;

    const desc = document.createElement('p');
    desc.className = 'task-card__description';
    desc.textContent = task.description || 'Нет описания';

    const dueDate = document.createElement('div');
    dueDate.className = 'task-card__date';
    if (task.dueDate) {
        dueDate.innerHTML = `<i class="far fa-calendar-alt"></i> Срок: ${new Date(task.dueDate).toLocaleString()}`;
    } else {
        dueDate.innerHTML = '';
    }

    const actions = document.createElement('div');
    actions.className = 'task-card__actions';

    const completeBtn = document.createElement('button');
    completeBtn.className = 'task-card__btn complete-btn';
    completeBtn.innerHTML = '<i class="fas fa-check"></i>';
    completeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onToggle(task.id);
    });

    const editBtn = document.createElement('button');
    editBtn.className = 'task-card__btn edit-btn';
    editBtn.innerHTML = '<i class="fas fa-pen"></i>';
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onEdit(task);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-card__btn delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onDelete(task.id);
    });

    actions.append(completeBtn, editBtn, deleteBtn);
    card.append(title, desc, dueDate, actions);
    return card;
}