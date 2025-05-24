export interface Task {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    priority: string;
    status: string;
    completed: boolean;
    createdAt: string;
    completedAt?: string;
    snoozedUntil?: string;
}

export interface TaskStats {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    tasksByPriority: {
        high: number;
        medium: number;
        low: number;
    };
}

// Local Storage Keys
const TASKS_STORAGE_KEY = 'todo-tasks';

// Get tasks from local storage and clean up old ones
export const getTasks = (): Task[] => {
    if (typeof window === 'undefined') return [];
    const tasks = localStorage.getItem(TASKS_STORAGE_KEY);
    const parsedTasks = tasks ? JSON.parse(tasks) : [];

    // Filter out tasks older than 2 weeks
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const filteredTasks = parsedTasks.filter((task: Task) => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= twoWeeksAgo;
    });

    // Save filtered tasks if any were removed
    if (filteredTasks.length !== parsedTasks.length) {
        saveTasks(filteredTasks);
    }

    return filteredTasks;
};

// Save tasks to local storage
export const saveTasks = (tasks: Task[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
};

// Add new task
export const addTask = (task: Omit<Task, 'id' | 'completed' | 'createdAt'>): Task => {
    const newTask = {
        ...task,
        id: Date.now().toString(),
        completed: false,
        createdAt: new Date().toISOString(),
    };
    const tasks = getTasks();
    tasks.push(newTask);
    saveTasks(tasks);
    return newTask;
};

// Delete task
export const deleteTask = (taskId: string): void => {
    const tasks = getTasks().filter(task => task.id !== taskId);
    saveTasks(tasks);
};

// Update task
export const updateTask = (taskId: string, updates: Partial<Task>): Task | null => {
    const tasks = getTasks();
    const index = tasks.findIndex(task => task.id === taskId);
    if (index === -1) return null;

    tasks[index] = { ...tasks[index], ...updates };
    saveTasks(tasks);
    return tasks[index];
};

// Update task completion status
export const markTaskCompleted = (taskId: string, completed: boolean): Task | null => {
    const tasks = getTasks();
    const index = tasks.findIndex(task => task.id === taskId);
    if (index === -1) return null;

    tasks[index] = {
        ...tasks[index],
        completed,
        completedAt: completed ? new Date().toISOString() : undefined
    };
    saveTasks(tasks);
    return tasks[index];
};

// Snooze task
export const snoozeTask = (taskId: string, minutes: number): Task | null => {
    console.log(`Snoozing task ${taskId} for ${minutes} minutes`);

    const tasks = getTasks();
    const index = tasks.findIndex(task => task.id === taskId);
    if (index === -1) return null;

    const now = new Date();
    const [startHour, startMinute] = tasks[index].startTime.split(':').map(Number);
    const [endHour, endMinute] = tasks[index].endTime.split(':').map(Number);

    // Calculate task duration
    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;
    const duration = endInMinutes - startInMinutes;

    // Calculate new start and end times
    const newStartTime = new Date(now.getTime());
    const newEndTime = new Date(now.getTime() + duration * 60000);

    tasks[index] = {
        ...tasks[index],
        startTime: `${newStartTime.getHours().toString().padStart(2, '0')}:${newStartTime.getMinutes().toString().padStart(2, '0')}`,
        endTime: `${newEndTime.getHours().toString().padStart(2, '0')}:${newEndTime.getMinutes().toString().padStart(2, '0')}`,
        snoozedUntil: undefined // Clear the snooze time since we're adjusting the actual task times
    };

    saveTasks(tasks);
    return tasks[index];
};

// Get current task (considering snooze time)
export const getCurrentTask = (): Task | null => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return getTasks().find(task => {
        if (task.completed) return false;
        if (task.snoozedUntil && new Date(task.snoozedUntil) > now) return false;
        if (task.status === 'cancelled' || task.status === 'on-hold') return false;

        const [startHour, startMinute] = task.startTime.split(':').map(Number);
        const [endHour, endMinute] = task.endTime.split(':').map(Number);
        const [currentHour, currentMinute] = currentTime.split(':').map(Number);

        const startInMinutes = startHour * 60 + startMinute;
        const endInMinutes = endHour * 60 + endMinute;
        const currentInMinutes = currentHour * 60 + currentMinute;

        return currentInMinutes >= startInMinutes && currentInMinutes <= endInMinutes;
    }) || null;
};

// Get task statistics
export const getTaskStats = (): TaskStats => {
    const tasks = getTasks();
    const completedTasks = tasks.filter(task => task.completed);

    return {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
        tasksByPriority: {
            high: tasks.filter(task => task.priority === 'high').length,
            medium: tasks.filter(task => task.priority === 'medium').length,
            low: tasks.filter(task => task.priority === 'low').length,
        }
    };
};

// Calculate time remaining in minutes
export const getTimeRemaining = (endTime: string): number => {
    const now = new Date();
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const endInMinutes = endHour * 60 + endMinute;
    const currentInMinutes = now.getHours() * 60 + now.getMinutes();

    return Math.max(0, endInMinutes - currentInMinutes);
};

// Format time remaining
export const formatTimeRemaining = (minutes: number): string => {
    if (minutes <= 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

// Play priority-based alarm sound
export const playAlarm = async (priority: string = 'high') => {
    try {
        const audio = new Audio(`/sounds/priorities/${priority.toLowerCase()}.mp3`);
        await audio.play();
    } catch (error) {
        console.error('Error playing alarm sound:', error);
        // Fallback to default alarm if priority sound fails
        try {
            const fallbackAudio = new Audio('/sounds/alarm.mp3');
            await fallbackAudio.play();
        } catch (fallbackError) {
            console.error('Error playing fallback alarm sound:', fallbackError);
        }
    }
};

// Calculate warning time based on task duration
export const getWarningTime = (startTime: string, endTime: string): number => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;
    const duration = endInMinutes - startInMinutes;

    // Warning times based on task duration
    if (duration >= 360) return 30; // 6+ hours -> 30 min warning
    if (duration >= 60) return 10;  // 1+ hour -> 10 min warning
    if (duration >= 30) return 5;   // 30+ min -> 5 min warning
    return Math.max(1, Math.floor(duration * 0.1)); // 10% of duration for shorter tasks
};

// Play warning sound
export const playWarningSound = async () => {
    try {
        const audio = new Audio('/sounds/warning.mp3');
        await audio.play();
    } catch (error) {
        console.error('Error playing warning sound:', error);
    }
};