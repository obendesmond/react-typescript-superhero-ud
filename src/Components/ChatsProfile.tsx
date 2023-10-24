import React, { useEffect, useState } from "react";
import { chatType, userType } from "../Types";
import { getUserInfo, iCreatedChat } from "../Backend/Queries";
import { toastErr } from "../utils/toast";
import UserHeaderProfile from "./UserHeaderProfile";
import { defaultUser } from "../Redux/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../Redux/store";
import {
  setCurrentSelectedChat,
  setRightSidebarOpen,
} from "../Redux/chatsSlice";

type ChatsProfileType = {
  userId?: string;
  chat: chatType;
};

function ChatsProfile({ userId, chat }: ChatsProfileType) {
  const [userLoading, setUserLoading] = useState(false);
  const [user, setUser] = useState<userType>(defaultUser);
  const dispatch = useDispatch<AppDispatch>();
  const currentSelectedChat = useSelector(
    (state: RootState) => state.chat.currentSelectedChat
  );
  const {
    id: chatId,
    senderId,
    lastMsg,
    recieverToSenderNewMsgCount,
    senderToRecieverNewMsgCount,
  } = chat;

  useEffect(() => {
    const getUser = async () => {
      if (userId) {
        const usr = await getUserInfo(userId, setUserLoading);
        setUser(usr);
      } else toastErr("ChatsProfile: user not found");
    };
    getUser();
  }, [userId]);

  const handleSelectedChat = () => {
    dispatch(
      setCurrentSelectedChat({
        ...user,
        chatId,
        recieverToSenderNewMsgCount,
        senderToRecieverNewMsgCount,
      })
    );

    // close sidebar
    dispatch(setRightSidebarOpen());
  };

  return (
    <UserHeaderProfile
      handleClick={handleSelectedChat}
      user={user}
      otherUser
      loading={userLoading}
      lastMsg={lastMsg || "last message"}
      isSelected={userId === currentSelectedChat.id}
      newMsgCount={
        iCreatedChat(senderId)
          ? recieverToSenderNewMsgCount
          : senderToRecieverNewMsgCount
      }
    />
  );
}

export default ChatsProfile;
