import { createSlice } from "@reduxjs/toolkit";
import { taskListType, taskType } from "../Types";

export const defaultTaskList: taskListType = {
  title: "Sample Task List",
};
export const defaultTask: taskType = {
  title: "I'll do this at 9:00am",
  description: "This is what I'll need to do in order to finish this",
};

type taskListSliceType = {
  currentTaskList: taskListType[];
};

const initialState: taskListSliceType = {
  currentTaskList: [],
};

const taskListSlice = createSlice({
  name: "taskList",
  initialState,
  reducers: {
    setTaskList: (state, action) => {
      state.currentTaskList = action.payload;
    },
    addTaskList: (state, action) => {
      const newTaskList = action.payload;
      newTaskList.editMode = true;
      newTaskList.tasks = [];
      state.currentTaskList.unshift(newTaskList);
    },
    saveTaskListTitle: (state, action) => {
      const { id, title } = action.payload;
      state.currentTaskList = state.currentTaskList.map((tL) => {
        if (tL.id === id) {
          tL.title = title;
          tL.editMode = false;
        }
        return tL;
      });
    },
    taskListSwitchEditMode: (state, action) => {
      const { id, value } = action.payload;
      state.currentTaskList = state.currentTaskList.map((tL) => {
        if (tL.id === id) {
          tL.editMode = value !== undefined ? value : true;
        }
        return tL;
      });
    },
    deleteTaskList: (state, action) => {
      const listId = action.payload;
      state.currentTaskList = state.currentTaskList.filter(
        (tL) => tL.id !== listId
      );
    },
    addTask: (state, action) => {
      const { listId, newTask } = action.payload;

      const updatedList = state.currentTaskList.map((tL) => {
        if (tL.id === listId) {
          // switch current task list edit mode to false if it's true
          tL.editMode = false;

          // switch of edit mode of all other tasks and collapse them
          const tasks = tL.tasks?.map((t) => {
            t.editMode = false;
            t.collapsed = true;
            return t;
          });

          // push new task in edit mode
          tasks?.push({ ...newTask, editMode: true, collapsed: false });

          tL.tasks = tasks;
        }
        return tL;
      });

      state.currentTaskList = updatedList;
    },
    collapseTask: (state, action) => {
      const { listId, id } = action.payload;
      const taskList = state.currentTaskList.find((tL) => tL.id === listId);
      const listIdx = state.currentTaskList.findIndex((tL) => tL.id === listId);

      // collapse and uncollapse task
      taskList?.tasks?.map((t) => {
        if (t.id === id) {
          t.collapsed = !t.collapsed;
        }
      });

      if (taskList) state.currentTaskList[listIdx] = taskList;
    },
    collapseAllTask: (state, action) => {
      const { listId, value } = action.payload;
      const taskList = state.currentTaskList.find((tL) => tL.id === listId);
      const listIdx = state.currentTaskList.findIndex((tL) => tL.id === listId);

      // collapse all and turn off editmode for all tasks
      taskList?.tasks?.map((t) => {
        t.collapsed = value !== undefined ? value : true;
        t.editMode = false;
        return t;
      });

      if (taskList) state.currentTaskList[listIdx] = taskList;
    },
    taskSwitchEditMode: (state, action) => {
      const { listId, id, value } = action.payload;

      const updateTaskList = state.currentTaskList.map((tL) => {
        if (tL.id === listId) {
          const updatedT = tL.tasks?.map((t) => {
            if (t.id === id) {
              t.editMode = value !== undefined ? value : true;
            }
            return t;
          });
          tL.tasks = updatedT;
        }

        return tL;
      });

      state.currentTaskList = updateTaskList;
    },
    saveTask: (state, action) => {
      const { listId, id, title, description } = action.payload;

      const updatedTaskList = state.currentTaskList.map((tL) => {
        if (tL.id === listId) {
          const updatedTask = tL.tasks?.map((t) => {
            if (t.id === id) {
              t = { ...t, title, description, editMode: false };
            }
            return t;
          });
          tL.tasks = updatedTask;
        }
        return tL;
      });

      state.currentTaskList = updatedTaskList;
    },
    setTaskListTasks: (state, action) => {
      const { listId, tasks } = action.payload;

      const taskList = state.currentTaskList.map((tL) => {
        if (tL.id === listId) {
          tL.tasks = tasks;
        }
        return tL;
      });

      state.currentTaskList = taskList;
    },
    deleteTask: (state, action) => {
      const { listId, id } = action.payload;

      const updatedTaskList = state.currentTaskList.map((tL) => {
        if (tL.id === listId) {
          tL.tasks = tL.tasks?.filter((t) => t.id !== id);
        }
        return tL;
      });

      state.currentTaskList = updatedTaskList;
    },
  },
});

export const {
  setTaskList,
  addTaskList,
  saveTaskListTitle,
  taskListSwitchEditMode,
  deleteTaskList,
  addTask,
  collapseTask,
  taskSwitchEditMode,
  saveTask,
  setTaskListTasks,
  deleteTask,
  collapseAllTask,
} = taskListSlice.actions;

export default taskListSlice.reducer;
