import React from "react";
import Task from "./Task";
import { taskType } from "../Types";
import FlipMove from "react-flip-move";

type TasksType = {
  tasks: taskType[];
  listId: string;
};

function Tasks({ tasks, listId }: TasksType) {
  return (
    <div className="p-3 pb-5">
      <FlipMove>
        {tasks?.map((t) => (
          <Task key={t.id} task={t} listId={listId} />
        ))}
      </FlipMove>
      {tasks.length === 0 && <p className="text-center">No task added yet!</p>}
    </div>
  );
}

export default Tasks;
