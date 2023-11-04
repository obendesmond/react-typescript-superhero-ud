import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
} from "@firebase/auth";
import { auth, db } from "./Firebase";
import { toastErr, toastSucc } from "../utils/toast";
import CatchErr from "../utils/catchErr";
import {
  authDataType,
  chatType,
  messageType,
  setLoadingType,
  taskListType,
  taskType,
  userType,
} from "../Types";
import { NavigateFunction } from "react-router";
import {
  addDoc,
  and,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  or,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "@firebase/firestore";
import {
  defaultUser,
  setAlertProps,
  setUser,
  setUsers,
  userStorageName,
} from "../Redux/userSlice";
import { AppDispatch } from "../Redux/store";
import ConvertTime from "../utils/ConvertTime";
import AvatarGenerator from "../utils/avatarGenerator";
import {
  addTask,
  addTaskList,
  defaultTask,
  defaultTaskList,
  deleteTask,
  deleteTaskList,
  saveTask,
  saveTaskListTitle,
  setTaskList,
  setTaskListTasks,
} from "../Redux/taskListSlice";
import { setChats, setCurrentMessages } from "../Redux/chatsSlice";

// collection names
const usersColl = "users";
const tasksColl = "tasks";
const taskListColl = "taskList";
const chatsColl = "chats";
const messagesColl = "messages";

// register or signup a user
export const BE_signUp = (
  data: authDataType,
  setLoading: setLoadingType,
  reset: () => void,
  goTo: NavigateFunction,
  dispatch: AppDispatch
) => {
  const { email, password, confirmPassword } = data;

  // loading true
  setLoading(true);

  if (email && password) {
    if (password === confirmPassword) {
      createUserWithEmailAndPassword(auth, email, password)
        .then(async ({ user }) => {
          // generate user avatar with username
          const imgLink = AvatarGenerator(user.email?.split("@")[0]);

          const userInfo = await addUserToCollection(
            user.uid,
            user.email || "",
            user.email?.split("@")[0] || "",
            imgLink
          );

          // set user in store
          dispatch(setUser(userInfo));

          setLoading(false);
          reset();
          goTo("/dashboard");
        })
        .catch((err) => {
          CatchErr(err);
          setLoading(false);
        });
    } else toastErr("Passwords must match!", setLoading);
  } else toastErr("Fields shouldn't be left empty!", setLoading);
};

// sign in a user
export const BE_signIn = (
  data: authDataType,
  setLoading: setLoadingType,
  reset: () => void,
  goTo: NavigateFunction,
  dispatch: AppDispatch
) => {
  const { email, password } = data;

  // loading true
  setLoading(true);

  signInWithEmailAndPassword(auth, email, password)
    .then(async ({ user }) => {
      //update user isOnline to true
      await updateUserInfo({ id: user.uid, isOnline: true });

      // get user info
      const userInfo = await getUserInfo(user.uid);

      // set user in store
      dispatch(setUser(userInfo));

      setLoading(false);
      reset();
      goTo("/dashboard");
    })
    .catch((err) => {
      CatchErr(err);
      setLoading(false);
    });
};

// signout
export const BE_signOut = (
  dispatch: AppDispatch,
  goTo: NavigateFunction,
  setLoading: setLoadingType,
  deleteAcc?: boolean
) => {
  setLoading(true);
  // logout in firebase
  signOut(auth)
    .then(async () => {
      // set user offline
      if (!deleteAcc) await updateUserInfo({ isOffline: true });

      // set currentSelected user to empty user
      dispatch(setUser(defaultUser));

      // remove from local storage
      localStorage.removeItem(userStorageName);

      // route to auth page
      goTo("/auth");

      setLoading(false);
    })
    .catch((err) => CatchErr(err));
};

// get user from local storage
export const getStorageUser = () => {
  const usr = localStorage.getItem(userStorageName);
  if (usr) return JSON.parse(usr);
  else return "";
};

// save user profile
export const BE_saveProfile = async (
  dispatch: AppDispatch,
  data: { email: string; username: string; password: string; img: string },
  setLoading: setLoadingType
) => {
  setLoading(true);

  const { email, username, password, img } = data;
  const id = getStorageUser().id;

  if (id) {
    // update email if present
    if (email && auth.currentUser) {
      updateEmail(auth.currentUser, email)
        .then(() => {
          toastSucc("Email updated successfully!");
        })
        .catch((err) => CatchErr(err));
    }

    // update passsword if present
    if (password && auth.currentUser) {
      updatePassword(auth.currentUser, password)
        .then(() => {
          toastSucc("Password updated successfully!");
        })
        .catch((err) => CatchErr(err));
    }

    // update user collection only if username or img is present
    if (username || img) {
      await updateUserInfo({ username, img });
      toastSucc("Updated profile successfully!");
    }

    // get user latest info
    const userInfo = await getUserInfo(id);

    // update user in state or store
    dispatch(setUser(userInfo));
    setLoading(false);
  } else toastErr("BE_saveProfile: id not found");
};

// delete account
export const BE_deleteAccount = async (
  dispatch: AppDispatch,
  goTo: NavigateFunction,
  setLoading: setLoadingType
) => {
  setLoading(true);

  if (getStorageUser().id) {
    // get all taskList
    const userTaskList = await getAllTaskList();

    // loop through user tasklist and delete each
    if (userTaskList.length > 0) {
      userTaskList.forEach(async (tL) => {
        if (tL.id && tL.tasks)
          await BE_deleteTaskList(tL.id, tL.tasks, dispatch);
      });
    }

    // delete the user info from collection
    await deleteDoc(doc(db, usersColl, getStorageUser().id));

    // finally delete user account
    const user = auth.currentUser;

    console.log("USER TO BE DELETED", user);

    if (user) {
      deleteUser(user)
        .then(async () => {
          BE_signOut(dispatch, goTo, setLoading, true);
          //window.location.reload();
        })
        .catch((err) => CatchErr(err));
    }
  }
};

// get all users
export const BE_getAllUsers = async (
  dispatch: AppDispatch,
  setLoading: setLoadingType
) => {
  setLoading(true);

  // get all users except the current signin one, those online ontop
  const q = query(collection(db, usersColl), orderBy("isOnline", "desc"));
  onSnapshot(q, (usersSnapshot) => {
    let users: userType[] = [];

    usersSnapshot.forEach((user) => {
      const { img, isOnline, username, email, bio, creationTime, lastSeen } =
        user.data();
      users.push({
        id: user.id,
        img,
        isOnline,
        username,
        email,
        bio,
        creationTime: creationTime
          ? ConvertTime(creationTime.toDate())
          : "no date yet: all users creation time",
        lastSeen: lastSeen
          ? ConvertTime(lastSeen.toDate())
          : "no date yet: all users lastseen",
      });
    });

    // take out the current user
    const id = getStorageUser().id;
    if (id) {
      dispatch(setUsers(users.filter((u) => u.id !== id)));
    }
    setLoading(false);
  });
};

// get user information
export const getUserInfo = async (
  id: string,
  setLoading?: setLoadingType
): Promise<userType> => {
  if (setLoading) setLoading(true);
  const userRef = doc(db, usersColl, id);
  const user = await getDoc(userRef);

  if (user.exists()) {
    const { img, isOnline, username, email, bio, creationTime, lastSeen } =
      user.data();

    if (setLoading) setLoading(false);

    return {
      id: user.id,
      img,
      isOnline,
      username,
      email,
      bio,
      creationTime: creationTime
        ? ConvertTime(creationTime.toDate())
        : "no date yet: userinfo",
      lastSeen: lastSeen
        ? ConvertTime(lastSeen.toDate())
        : "no date yet: userinfo",
    };
  } else {
    if (setLoading) setLoading(false);
    toastErr("getUserInfo: user not found");
    return defaultUser;
  }
};

// add user to collection
const addUserToCollection = async (
  id: string,
  email: string,
  username: string,
  img: string
) => {
  // create user with userId
  await setDoc(doc(db, usersColl, id), {
    isOnline: true,
    img,
    username,
    email,
    creationTime: serverTimestamp(),
    lastSeen: serverTimestamp(),
    bio: `Hi! my name is ${username}, thanks to Desmond I understand React and Typescript now, and I'm confortable working with them. I can also build beautiful user interfaces`,
  });

  return getUserInfo(id);
};

// update user info
const updateUserInfo = async ({
  id,
  username,
  img,
  isOnline,
  isOffline,
}: {
  id?: string;
  username?: string;
  img?: string;
  isOnline?: boolean;
  isOffline?: boolean;
}) => {
  if (!id) {
    id = getStorageUser().id;
  }

  // {username} // ...{username} = username
  // username ? {username} : null
  // username && {username}

  if (id) {
    await updateDoc(doc(db, usersColl, id), {
      ...(username && { username }),
      ...(isOnline && { isOnline }),
      ...(isOffline && { isOnline: false }),
      ...(img && { img }), // img:"someimage"
      lastSeen: serverTimestamp(),
    });
  }
};

// -------------------------- FOR Task list ----------------------

// add a single task list
export const BE_addTaskList = async (
  dispatch: AppDispatch,
  setLoading: setLoadingType
) => {
  setLoading(true);
  const { title } = defaultTaskList;
  const list = await addDoc(collection(db, taskListColl), {
    title,
    userId: getStorageUser().id,
  });

  const newDocSnap = await getDoc(doc(db, list.path));

  if (newDocSnap.exists()) {
    const newlyAddedDoc: taskListType = {
      id: newDocSnap.id,
      title: newDocSnap.data().title,
    };

    dispatch(addTaskList(newlyAddedDoc));
    setLoading(false);
  } else {
    toastErr("BE_addTaskList:No such doc");
    setLoading(false);
  }
};

// get all task list
export const BE_getTaskList = async (
  dispatch: AppDispatch,
  setLoading: setLoadingType
) => {
  setLoading(true);

  if (getStorageUser().id) {
    // get user task list
    const taskList = await getAllTaskList();

    dispatch(setTaskList(taskList));
    setLoading(false);
  }
};

// save task list title
export const BE_saveTaskList = async (
  dispatch: AppDispatch,
  setLoading: setLoadingType,
  listId: string,
  title: string
) => {
  setLoading(true);

  await updateDoc(doc(db, taskListColl, listId), { title });

  const updatedTaskList = await getDoc(doc(db, taskListColl, listId));

  setLoading(false);

  // dispatch to save task list
  dispatch(
    saveTaskListTitle({ id: updatedTaskList.id, ...updatedTaskList.data() })
  );
};

// delete task list
export const BE_deleteTaskList = async (
  listId: string,
  tasks: taskType[],
  dispatch: AppDispatch,
  setLoading?: setLoadingType
) => {
  if (setLoading) setLoading(true);

  // looping through tasks and deleting each
  if (tasks.length > 0) {
    for (let i = 0; i < tasks.length; i++) {
      const { id } = tasks[i];
      if (id) BE_deleteTask(listId, id, dispatch);
    }
  }

  // delete task list board
  const listRef = doc(db, taskListColl, listId);
  await deleteDoc(listRef);

  const deletedTaskList = await getDoc(listRef);

  if (!deletedTaskList.exists()) {
    if (setLoading) setLoading(false);
    // update state
    dispatch(deleteTaskList(listId));
  }
};

// get all users taskList
const getAllTaskList = async () => {
  const id = getStorageUser().id;
  const q = query(collection(db, taskListColl), where("userId", "==", id));

  const taskListSnapshot = await getDocs(q);
  const taskList: taskListType[] = [];

  taskListSnapshot.forEach((doc) => {
    const { title } = doc.data();
    taskList.push({
      id: doc.id,
      title,
      editMode: false,
      tasks: [],
    });
  });

  return taskList;
};

// -------------------------------- FOR TASK -------------------------------

// delete task
export const BE_deleteTask = async (
  listId: string,
  id: string,
  dispatch: AppDispatch,
  setLoading?: setLoadingType
) => {
  if (setLoading) setLoading(true);

  // delete doc
  const taskRef = doc(db, taskListColl, listId, tasksColl, id);
  await deleteDoc(taskRef);

  const deletedTask = await getDoc(taskRef);

  if (!deletedTask.exists()) {
    if (setLoading) setLoading(false);
    dispatch(deleteTask({ listId, id }));
  }
};

// add task
export const BE_addTask = async (
  dispatch: AppDispatch,
  listId: string,
  setLoading: setLoadingType
) => {
  setLoading(true);

  const task = await addDoc(collection(db, taskListColl, listId, tasksColl), {
    ...defaultTask,
  });

  const newTaskSnapShot = await getDoc(doc(db, task.path));

  if (newTaskSnapShot.exists()) {
    const { title, description } = newTaskSnapShot.data();
    const newTask: taskType = {
      id: newTaskSnapShot.id,
      title,
      description,
    };
    // add in store
    dispatch(addTask({ listId, newTask }));
    setLoading(false);
  } else {
    toastErr("BE_addTask: No such document");
    setLoading(false);
  }
};

// update task
export const BE_saveTask = async (
  dispatch: AppDispatch,
  listId: string,
  data: taskType,
  setLoading: setLoadingType
) => {
  setLoading(true);
  const { id, title, description } = data;

  if (id) {
    const taskRef = doc(db, taskListColl, listId, tasksColl, id);
    await updateDoc(taskRef, { title, description });

    const updatedTask = await getDoc(taskRef);

    if (updatedTask.exists()) {
      setLoading(false);
      // dispatch
      dispatch(saveTask({ listId, id: updatedTask.id, ...updatedTask.data() }));
    } else toastErr("BE_saveTask: updated task not found");
  } else toastErr("BE_saveTask: id not found");
};

// get tasks for task list
export const getTasksForTaskList = async (
  dispatch: AppDispatch,
  listId: string,
  setLoading: setLoadingType
) => {
  setLoading(true);

  // get tasks in a single task list
  const taskRef = collection(db, taskListColl, listId, tasksColl);
  const tasksSnapshot = await getDocs(taskRef);
  const tasks: taskType[] = [];

  // if the tasks snap shot is not empty then do foreach
  if (!tasksSnapshot.empty) {
    tasksSnapshot.forEach((task) => {
      const { title, description } = task.data();
      tasks.push({
        id: task.id,
        title,
        description,
        editMode: false,
        collapsed: true,
      });
    });
  }

  dispatch(setTaskListTasks({ listId, tasks }));
  setLoading(false);
};

// -------------------------------- FOR CHATS -------------------------------

// start a chat
export const BE_startChat = async (
  dispatch: AppDispatch,
  rId: string,
  rName: string,
  setLoading: setLoadingType
) => {
  const sId = getStorageUser().id;
  setLoading(true);

  // check if chat exists first
  const q = query(
    collection(db, chatsColl),
    or(
      and(where("senderId", "==", sId), where("recieverId", "==", rId)),
      and(where("senderId", "==", rId), where("recieverId", "==", sId))
    )
  );
  const res = await getDocs(q);

  // if you find no chat with this two ids then create one
  if (res.empty) {
    const newChat = await addDoc(collection(db, chatsColl), {
      senderId: sId,
      recieverId: rId,
      lastMsg: "",
      updatedAt: serverTimestamp(),
      senderToRecieverNewMsgCount: 0,
      recieverToSenderNewMsgCount: 0,
    });

    const newChatSnapshot = await getDoc(doc(db, newChat.path));

    if (!newChatSnapshot.exists()) {
      toastErr("BE_startChat: No such document");
    }
    setLoading(false);
    dispatch(setAlertProps({ open: false }));
  } else {
    toastErr("You already started chatting with " + rName);
    setLoading(false);
    dispatch(setAlertProps({ open: false }));
  }
};

// get users chats
export const BE_getChats = async (dispatch: AppDispatch) => {
  const id = getStorageUser().id;

  const q = query(
    collection(db, chatsColl),
    or(where("senderId", "==", id), where("recieverId", "==", id)),
    orderBy("updatedAt", "desc")
  );

  onSnapshot(q, (chatSnapshot) => {
    const chats: chatType[] = [];

    chatSnapshot.forEach((chat) => {
      const {
        senderId,
        recieverId,
        lastMsg,
        updatedAt,
        recieverToSenderNewMsgCount,
        senderToRecieverNewMsgCount,
      } = chat.data();

      chats.push({
        id: chat.id,
        senderId,
        recieverId,
        lastMsg,
        updatedAt,
        recieverToSenderNewMsgCount,
        senderToRecieverNewMsgCount,
      });
    });

    console.log("CHATS", chats);
    dispatch(setChats(chats));
  });
};

// get users messages
export const BE_getMsgs = async (
  dispatch: AppDispatch,
  chatId: string,
  setLoading: setLoadingType
) => {
  setLoading(true);

  const q = query(
    collection(db, chatsColl, chatId, messagesColl),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, (messagesSnapshot) => {
    let msgs: messageType[] = [];

    messagesSnapshot.forEach((msg) => {
      const { senderId, content, createdAt } = msg.data();
      msgs.push({
        id: msg.id,
        senderId,
        content,
        createdAt: createdAt
          ? ConvertTime(createdAt.toDate())
          : "no date yet: all messages",
      });
    });

    dispatch(setCurrentMessages(msgs));
    setLoading(false);
  });
};

// get users messages
export const BE_sendMsgs = async (
  chatId: string,
  data: messageType,
  setLoading: setLoadingType
) => {
  setLoading(true);

  const res = await addDoc(collection(db, chatsColl, chatId, messagesColl), {
    ...data,
    createdAt: serverTimestamp(),
  });

  const newMsg = await getDoc(doc(db, res.path));
  if (newMsg.exists()) {
    setLoading(false);
    // reset new message count
    await updateNewMsgCount(chatId, true);
    await updateLastMsg(chatId, newMsg.data().content);
    await updateUserInfo({}); // update last seen
  }
};

// function to check if I created a chat
export const iCreatedChat = (senderId: string) => {
  const myId = getStorageUser().id;
  return myId === senderId;
};

// updat new message count for user
export const updateNewMsgCount = async (chatId: string, reset?: boolean) => {
  const chat = await getDoc(doc(db, chatsColl, chatId));

  let senderToRecieverNewMsgCount = chat.data()?.senderToRecieverNewMsgCount;
  let recieverToSenderNewMsgCount = chat.data()?.recieverToSenderNewMsgCount;

  if (iCreatedChat(chat.data()?.senderId)) {
    if (reset) recieverToSenderNewMsgCount = 0;
    else senderToRecieverNewMsgCount++;
  } else {
    if (reset) senderToRecieverNewMsgCount = 0;
    else recieverToSenderNewMsgCount++;
  }

  await updateDoc(doc(db, chatsColl, chatId), {
    updatedAt: serverTimestamp(),
    senderToRecieverNewMsgCount,
    recieverToSenderNewMsgCount,
  });
};

// update last message
const updateLastMsg = async (chatId: string, lastMsg: string) => {
  await updateNewMsgCount(chatId);
  // await message count here
  await updateDoc(doc(db, chatsColl, chatId), {
    lastMsg,
    updatedAt: serverTimestamp(),
  });
};
