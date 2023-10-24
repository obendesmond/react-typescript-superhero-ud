import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../Redux/store";
import ChatsProfile from "./ChatsProfile";
import { iCreatedChat } from "../Backend/Queries";

function Chats() {
  const chats = useSelector((state: RootState) => state.chat.chats);

  return chats.length === 0 ? (
    <div className="p-10">
      No chats yet for you, chose a user and start chatting!
    </div>
  ) : (
    <>
      {chats.map((c) => (
        <ChatsProfile
          key={c.id}
          chat={c}
          userId={iCreatedChat(c.senderId) ? c.recieverId : c.senderId}
        />
      ))}
    </>
  );
}

export default Chats;
