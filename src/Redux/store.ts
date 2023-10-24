import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./userSlice";
import taskListSlice from "./taskListSlice";
import chatsSlice from "./chatsSlice";

export const store = configureStore({
  reducer: {
    user: userSlice,
    taskList: taskListSlice,
    chat: chatsSlice,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
