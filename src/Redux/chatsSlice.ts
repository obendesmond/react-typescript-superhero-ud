import { createSlice } from "@reduxjs/toolkit";
import { chatType, messageType, userType } from "../Types";
import { defaultUser } from "./userSlice";
import { iCreatedChat } from "../Backend/Queries";

type chatStateType = {
  chats: chatType[];
  isChatsTab: boolean;
  currentSelectedChat: userType & {
    chatId?: string;
    senderToRecieverNewMsgCount?: number;
    recieverToSenderNewMsgCount?: number;
  };
  rightSidebarOpen: boolean;
  currentMessages: messageType[];
  hasNewMessage: boolean;
};

const initialState: chatStateType = {
  chats: [],
  isChatsTab: false,
  currentSelectedChat: defaultUser,
  rightSidebarOpen: true,
  currentMessages: [],
  hasNewMessage: false,
};

const chatsSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setIsChatsTab: (state, action: { payload: boolean; type: string }) => {
      state.isChatsTab = action.payload;
    },
    setChats: (state, action: { payload: chatType[] }) => {
      const chats = action.payload;

      const newMsgCount = chats.reduce((acc, c) => {
        if (iCreatedChat(c.senderId)) {
          return acc + (c.recieverToSenderNewMsgCount || 0);
        } else return acc + (c.senderToRecieverNewMsgCount || 0);
      }, 0);

      state.hasNewMessage = newMsgCount > 0;
      state.chats = chats;
    },
    setCurrentSelectedChat: (state, action) => {
      state.currentSelectedChat = action.payload;
    },
    setRightSidebarOpen: (state) => {
      state.rightSidebarOpen = !state.rightSidebarOpen;
    },
    setCurrentMessages: (state, action) => {
      state.currentMessages = action.payload;
    },
  },
});

export const {
  setIsChatsTab,
  setChats,
  setCurrentSelectedChat,
  setRightSidebarOpen,
  setCurrentMessages,
} = chatsSlice.actions;
export default chatsSlice.reducer;
