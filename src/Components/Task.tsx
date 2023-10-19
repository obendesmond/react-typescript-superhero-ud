import React, { forwardRef, useState } from "react";
import Icon from "./Icon";
import { MdDelete, MdEdit, MdSave } from "react-icons/md";
import { taskType } from "../Types";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../Redux/store";
import { collapseTask, taskSwitchEditMode } from "../Redux/taskListSlice";
import { BE_deleteTask, BE_saveTask } from "../Backend/Queries";

type TaskType = {
  task: taskType;
  listId: string;
};

const Task = forwardRef(
  (
    { task, listId }: TaskType,
    ref: React.LegacyRef<HTMLDivElement> | undefined
  ) => {
    const { id, title, description, editMode, collapsed } = task;
    const [homeTitle, setHomeTitle] = useState(title);
    const [homeDescription, setHomeDescription] = useState(description);
    const [saveLoading, setSaveLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const dispatch = useDispatch<AppDispatch>();

    const handleSave = () => {
      const taskData: taskType = {
        id,
        title: homeTitle,
        description: homeDescription,
      };
      console.log(taskData);
      // save func
      BE_saveTask(dispatch, listId, taskData, setSaveLoading);
    };

    const handleDelete = () => {
      if (id) BE_deleteTask(listId, id, dispatch, setDeleteLoading);
    };

    return (
      <div
        ref={ref}
        className="p-2 mb-2 bg-white rounded-md drop-shadow-sm hover:drop-shadow-md"
      >
        <div>
          {editMode ? (
            <input
              value={homeTitle}
              onChange={(e) => setHomeTitle(e.target.value)}
              className="border-2 px-2 border-myBlue rounded-sm mb-1"
              placeholder="Task title"
            />
          ) : (
            <p
              onClick={() => dispatch(collapseTask({ listId, id }))}
              className="cursor-pointer"
            >
              {title}
            </p>
          )}
        </div>
        {!collapsed && (
          <div>
            <hr />
            <div>
              {editMode ? (
                <textarea
                  onChange={(e) => setHomeDescription(e.target.value)}
                  value={homeDescription}
                  placeholder="todo description"
                  className="w-full px-3 border-2 border-myBlue rounded-md mt-2"
                />
              ) : (
                <p className="p-2 text-justify">{description}</p>
              )}

              <div className="flex justify-end">
                <Icon
                  onClick={() =>
                    editMode
                      ? handleSave()
                      : dispatch(taskSwitchEditMode({ listId, id }))
                  }
                  IconName={editMode ? MdSave : MdEdit}
                  loading={editMode && saveLoading}
                  size={16}
                />
                <Icon
                  onClick={handleDelete}
                  IconName={MdDelete}
                  loading={deleteLoading}
                  size={16}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default Task;
