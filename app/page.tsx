"use client";

import { useState, useEffect } from "react";
import {
  Task,
  getTasks,
  addTask,  // Uncommented this import
  deleteTask,
  updateTask,
  getCurrentTask,
  getTimeRemaining,
  formatTimeRemaining,
  playAlarm,
  getTaskStats,
  TaskStats,
  getWarningTime,
  playWarningSound
} from "./utils";

export default function Home() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [newTask, setNewTask] = useState({
    title: "",
    startTime: "",
    endTime: "",
    priority: "high",
    status: "in-progress",
  });
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    tasksByPriority: { high: 0, medium: 0, low: 0 }
  });
  const [showStats, setShowStats] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);

  // Load tasks and start timer
  useEffect(() => {
    const loadTasks = () => {
      const loadedTasks = getTasks();
      setTasks(loadedTasks);
      setTaskStats(getTaskStats());
    };

    loadTasks();
    const interval = setInterval(() => {
      const current = getCurrentTask();
      setCurrentTask(current);

      if (current) {
        const remaining = getTimeRemaining(current.endTime);
        setTimeRemaining(formatTimeRemaining(remaining));

        // Check for warning time
        const warningMinutes = getWarningTime(current.startTime, current.endTime);
        if (!hasShownWarning && remaining <= warningMinutes && remaining > 0) {
          playWarningSound();
          setShowWarningModal(true);
          setHasShownWarning(true);
        }

        // Play priority-based alarm when task ends
        if (remaining === 0 && !current.completed) {
          playAlarm(current.priority);
          setTaskToComplete(current);
          setShowCompletionModal(true);
          setHasShownWarning(false); // Reset warning flag for next task
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hasShownWarning]);

  // Handle adding new task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    //disab;e esllint for the next line
    // eslint-disable-next-line no-unused-vars
    const task = addTask(newTask);
    console.log(task, "Task added successfully");

    setTasks(getTasks());
    setTaskStats(getTaskStats());
    setNewTask({ title: "", startTime: "", endTime: "", priority: "high", status: "in-progress" });
    setShowAddModal(false);
  };

  // Handle deleting task
  // const handleDeleteTask = (taskId: string) => {
  //   deleteTask(taskId);
  //   setTasks(tasks.filter((task) => task.id !== taskId));
  // };

  // Handle task completion
  const handleTaskCompletion = (completed: boolean) => {
    if (taskToComplete) {
      updateTask(taskToComplete.id, {
        completed,
        completedAt: completed ? new Date().toISOString() : undefined,
        status: completed ? 'completed' : 'in-progress'
      });
      setTasks(getTasks());
      setTaskStats(getTaskStats());
      setShowCompletionModal(false);
      setTaskToComplete(null);
    }
  };

  // Handle snooze to adjust task time
  const handleSnooze = (minutes: number) => {
    if (taskToComplete) {
      const now = new Date();
      const snoozedEndTime = new Date(now.getTime() + minutes * 60000);
      const snoozedEndTimeString = `${snoozedEndTime.getHours().toString().padStart(2, '0')}:${snoozedEndTime.getMinutes().toString().padStart(2, '0')}`;

      updateTask(taskToComplete.id, { endTime: snoozedEndTimeString });
      setTasks(getTasks());
      setShowCompletionModal(false);
      setTaskToComplete(null);
    }
  };

  // Handle task edit
  const handleEditTask = (taskId: string, updates: Partial<Task>) => {
    const updatedTask = updateTask(taskId, updates);
    if (updatedTask) {
      setTasks(getTasks());
      setEditingTask(null);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirmation = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete.id);
      setTasks(getTasks());
      setShowDeleteModal(false);
      setTaskToDelete(null);
    }
  };

  return (
    <div className="h-screen bg-luxury-black text-luxury-silver overflow-hidden relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-5">
        {[...Array(36)].map((_, i) => (
          <div key={i} className="border border-luxury-gold/10" />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="fixed top-8 left-8 space-y-4 z-10 animate-fade-in">
        <button
          onClick={() => setShowAddModal(true)}
          className="glass-effect rounded-full p-4 w-12 h-12 flex items-center justify-center hover:bg-luxury-gray/50 transition-all"
        >
          <span className="text-2xl text-luxury-gold">+</span>
        </button>
        <button
          onClick={() => setShowAllTasks(true)}
          className="glass-effect rounded-full p-4 w-12 h-12 flex items-center justify-center hover:bg-luxury-gray/50 transition-all"
        >
          <span className="text-luxury-gold text-sm">ALL</span>
        </button>
        <button
          onClick={() => setShowStats(!showStats)}
          className="glass-effect rounded-full p-4 w-12 h-12 flex items-center justify-center hover:bg-luxury-gray/50 transition-all"
        >
          <span className="text-luxury-gold text-sm">STATS</span>
        </button>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <div className="fixed top-8 left-24 z-10 animate-fade-in">
          <div className="glass-effect rounded-2xl p-6 w-64">
            <h3 className="text-luxury-gold text-lg mb-4">Task Statistics</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Completion Rate</p>
                <p className="text-lg">{taskStats.completionRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Tasks by Priority</p>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div>
                    <p className="text-xs text-gray-400">High</p>
                    <p className="text-luxury-gold">{taskStats.tasksByPriority.high}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Medium</p>
                    <p className="text-luxury-gold">{taskStats.tasksByPriority.medium}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Low</p>
                    <p className="text-luxury-gold">{taskStats.tasksByPriority.low}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Tasks</p>
                <p>{taskStats.totalTasks} ({taskStats.completedTasks} completed)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative h-screen p-8">
        {/* Current Time Display */}
        <div className="absolute top-8 right-8 text-right animate-fade-in">
          <p className="text-sm text-gray-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-luxury-gold text-xl">
            {new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </p>
        </div>

        {/* Current Task - Prominent Display */}
        <div className="flex items-center justify-center h-screen">
          <div className="w-full max-w-5xl animate-float">
            {currentTask ? (
              <div className="glass-effect rounded-2xl p-12 border-2 animate-pulse-border">
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-luxury-gold text-sm tracking-wider">
                      CURRENT TASK
                    </span>
                    <span className="text-luxury-gold text-sm">
                      {timeRemaining} remaining
                    </span>
                  </div>

                  <h1 className="text-6xl font-light text-luxury-silver mb-8">
                    {currentTask.title}
                  </h1>

                  <div className="flex items-center space-x-6 text-xl text-gray-400">
                    <span>
                      {currentTask.startTime} - {currentTask.endTime}
                    </span>
                    <span className="h-2 w-2 bg-luxury-gold rounded-full"></span>
                    <span>{currentTask.priority} Priority</span>
                  </div>

                  <div className="mt-8">
                    <div className="w-full h-1 bg-luxury-accent rounded-full overflow-hidden">
                      <div
                        className="h-full bg-luxury-gold transition-all duration-1000"
                        style={{
                          width:
                            `${Math.max(
                              0,
                              Math.min(
                                100,
                                (getTimeRemaining(currentTask.endTime) /
                                  (parseInt(currentTask.endTime.split(":")[0]) *
                                    60 +
                                    parseInt(currentTask.endTime.split(":")[1]) -
                                    (parseInt(currentTask.startTime.split(":")[0]) *
                                      60 +
                                      parseInt(currentTask.startTime.split(":")[1]))) *
                                  100
                                )
                              ))}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-effect rounded-2xl p-12 border-2 animate-pulse-border">
                <div className="space-y-6 animate-fade-in">
                  <h1 className="text-4xl font-light text-gray-400 text-center">
                    No Current Task
                  </h1>
                  <p className="text-center text-gray-500">
                    Add a task to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Task Completion Modal with Snooze */}
      {showCompletionModal && taskToComplete && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/60" />
          <div className="modal-glass relative rounded-2xl p-8 w-full max-w-lg mx-4 animate-scale-in">
            <h2 className="text-2xl text-luxury-gold mb-6">Task Complete?</h2>
            <p className="text-luxury-silver mb-6">
              Did you complete: {taskToComplete.title}?
            </p>
            <div className="space-y-4">
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleTaskCompletion(false)}
                  className="px-6 py-2 rounded-lg border border-luxury-gold/20 text-luxury-gold hover:bg-luxury-gray/50 transition-all"
                >
                  No
                </button>
                <button
                  onClick={() => handleTaskCompletion(true)}
                  className="px-6 py-2 rounded-lg bg-luxury-gold text-luxury-black hover:bg-luxury-gold/90 transition-all"
                >
                  Yes
                </button>
              </div>

              <div className="border-t border-luxury-gold/10 pt-4">
                <p className="text-sm text-gray-400 mb-3">Or snooze for:</p>
                <div className="flex justify-center space-x-3">
                  {[5, 10, 15, 30].map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => handleSnooze(minutes)}
                      className="px-4 py-2 rounded-lg bg-luxury-gray/50 hover:bg-luxury-gray/70 transition-all"
                    >
                      {minutes}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && taskToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDeleteModal(false)} />
          <div className="modal-glass relative rounded-2xl p-8 w-full max-w-lg mx-4 animate-scale-in">
            <h2 className="text-2xl text-luxury-gold mb-6">Confirm Delete</h2>
            <p className="text-luxury-silver mb-6">
              Are you sure you want to delete: {taskToDelete.title}?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2 rounded-lg border border-luxury-gold/20 text-luxury-gold hover:bg-luxury-gray/50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmation}
                className="px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && currentTask && (
        <div className="fixed inset-0 flex items-center justify-center z-[70]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowWarningModal(false)} />
          <div className="modal-glass relative rounded-2xl p-8 w-full max-w-lg mx-4 animate-scale-in border-2 border-yellow-500/50">
            <h2 className="text-2xl text-yellow-500 mb-6">Time Warning</h2>
            <p className="text-luxury-silver mb-6">
              {`Task "${currentTask.title}" is almost ending! You have ${timeRemaining} remaining.`}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-6 py-2 rounded-lg bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 transition-all"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal - Update z-index */}
      {editingTask && (
        <div className="fixed inset-0 flex items-center justify-center z-[80]">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setEditingTask(null)}
          />
          <div className="modal-glass relative rounded-2xl p-8 w-full max-w-lg mx-4 animate-scale-in">
            <h2 className="text-2xl text-luxury-gold mb-6">Edit Task</h2>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleEditTask(editingTask.id, {
                  title: editingTask.title,
                  startTime: editingTask.startTime,
                  endTime: editingTask.endTime,
                  priority: editingTask.priority,
                  status: editingTask.status,
                });
              }}
            >
              <div>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, title: e.target.value })
                  }
                  className="w-full bg-luxury-gray/50 border border-luxury-gold/20 rounded-lg p-3 text-luxury-silver focus:outline-none focus:border-luxury-gold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="time"
                  value={editingTask.startTime}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, startTime: e.target.value })
                  }
                  className="bg-luxury-gray/50 border border-luxury-gold/20 rounded-lg p-3 text-luxury-silver focus:outline-none focus:border-luxury-gold"
                  required
                />
                <input
                  type="time"
                  value={editingTask.endTime}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, endTime: e.target.value })
                  }
                  className="bg-luxury-gray/50 border border-luxury-gold/20 rounded-lg p-3 text-luxury-silver focus:outline-none focus:border-luxury-gold"
                  required
                />
              </div>
              <select
                value={editingTask.priority}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, priority: e.target.value })
                }
                className="w-full bg-luxury-gray/50 border border-luxury-gold/20 rounded-lg p-3 text-luxury-silver focus:outline-none focus:border-luxury-gold"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
              <select
                value={editingTask.status}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, status: e.target.value })
                }
                className="w-full bg-luxury-gray/50 border border-luxury-gold/20 rounded-lg p-3 text-luxury-silver focus:outline-none focus:border-luxury-gold"
              >
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="on-hold">On Hold</option>
              </select>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-6 py-2 rounded-lg border border-luxury-gold/20 text-luxury-gold hover:bg-luxury-gray/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-luxury-gold text-luxury-black hover:bg-luxury-gold/90 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowAddModal(false)}
          />
          <div className="modal-glass relative rounded-2xl p-8 w-full max-w-lg mx-4 animate-scale-in">
            <h2 className="text-2xl text-luxury-gold mb-6">Add New Task</h2>
            <form className="space-y-4" onSubmit={handleAddTask}>
              <div>
                <input
                  type="text"
                  placeholder="Task Title"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="w-full bg-luxury-gray/50 border border-luxury-gold/20 rounded-lg p-3 text-luxury-silver focus:outline-none focus:border-luxury-gold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="time"
                  value={newTask.startTime}
                  onChange={(e) =>
                    setNewTask({ ...newTask, startTime: e.target.value })
                  }
                  className="bg-luxury-gray/50 border border-luxury-gold/20 rounded-lg p-3 text-luxury-silver focus:outline-none focus:border-luxury-gold"
                  required
                />
                <input
                  type="time"
                  value={newTask.endTime}
                  onChange={(e) =>
                    setNewTask({ ...newTask, endTime: e.target.value })
                  }
                  className="bg-luxury-gray/50 border border-luxury-gold/20 rounded-lg p-3 text-luxury-silver focus:outline-none focus:border-luxury-gold"
                  required
                />
              </div>
              <select
                value={newTask.priority}
                onChange={(e) =>
                  setNewTask({ ...newTask, priority: e.target.value })
                }
                className="w-full bg-luxury-gray/50 border border-luxury-gold/20 rounded-lg p-3 text-luxury-silver focus:outline-none focus:border-luxury-gold"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
              <select
                value={newTask.status}
                onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                className="w-full bg-luxury-gray/50 border border-luxury-gold/20 rounded-lg p-3 text-luxury-silver focus:outline-none focus:border-luxury-gold"
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="on-hold">On Hold</option>
              </select>
              <button
                type="submit"
                className="w-full bg-luxury-gold text-luxury-black rounded-lg p-3 mt-6 hover:bg-luxury-gold/90 transition-all"
              >
                Add Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View All Tasks Modal */}
      {showAllTasks && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowAllTasks(false)}
          />
          <div className="modal-glass relative rounded-2xl p-8 w-full max-w-3xl mx-4 max-h-[80vh] overflow-auto animate-scale-in">
            <h2 className="text-2xl text-luxury-gold mb-6 sticky top-0 bg-luxury-black/95 pb-4">
              All Tasks
            </h2>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`glass-effect rounded-lg p-4 flex items-center justify-between group ${task.completed ? "opacity-50" : ""
                    }`}
                >
                  <div>
                    <h3 className="text-luxury-silver text-lg flex items-center gap-2">
                      {task.title}
                      {task.completed && (
                        <span className="text-sm text-luxury-gold">
                          (Completed)
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>
                        {task.startTime} - {task.endTime}
                      </span>
                      <span className="h-1 w-1 bg-luxury-gold rounded-full"></span>
                      <span>{task.priority} Priority</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-2 hover:bg-luxury-gray/50 rounded-full"
                    >
                      <span className="text-luxury-gold">✎</span>
                    </button>
                    <button
                      onClick={() => {
                        setTaskToDelete(task);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 hover:bg-luxury-gray/50 rounded-full"
                    >
                      <span className="text-red-500">×</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
