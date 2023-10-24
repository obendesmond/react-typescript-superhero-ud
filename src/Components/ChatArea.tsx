import React, { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import {
  BsFillSendFill,
  BsFillCameraFill,
  BsFillEmojiSunglassesFill,
  BsFillPeopleFill,
} from "react-icons/bs";
import { ImAttachment } from "react-icons/im";
import Input from "./Input";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../Redux/store";
import { setRightSidebarOpen } from "../Redux/chatsSlice";
import { BE_getMsgs, BE_sendMsgs, getStorageUser } from "../Backend/Queries";
import { MessagesLoader } from "./Loaders";
import FlipMove from "react-flip-move";
import { toastInfo } from "../utils/toast";

function ChatArea() {
  const bottomeContainerRef = useRef<HTMLDivElement>(null);
  const [msg, setMsg] = useState("");
  const [getMsgsLoading, setGetMsgsLoading] = useState(false);
  const [createMsgLoading, setCreateMsgLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const currentSelectedChat = useSelector(
    (state: RootState) => state.chat.currentSelectedChat
  );
  const messages = useSelector(
    (state: RootState) => state.chat.currentMessages
  );
  const chatId = currentSelectedChat.chatId;

  useEffect(() => {
    const get = async () => {
      if (chatId) await BE_getMsgs(dispatch, chatId, setGetMsgsLoading);
    };
    get();
  }, [currentSelectedChat.id]);

  const handleSendMsg = async () => {
    if (msg.trim()) {
      const data = {
        senderId: getStorageUser().id,
        content: msg,
      };
      setMsg("");
      if (chatId) await BE_sendMsgs(chatId, data, setCreateMsgLoading);
      if (bottomeContainerRef)
        bottomeContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    } else toastInfo("Enter some text message!");
  };
  const checkEnter = (e: any) => {
    if (e.key === "Enter") handleSendMsg();
  };

  return (
    <div className="flex-1 lg:flex-[0.4] max-h-full flex flex-col px-2 md:px-5 gap-2">
      {getMsgsLoading ? (
        <MessagesLoader />
      ) : (
        <div className="flex-1 flex flex-col max-h-screen overflow-y-scroll shadow-inner gap-2">
          <FlipMove className="flex-1 flex flex-col gap-5">
            {messages.map((msg) => {
              const myId = getStorageUser().id;
              if (msg.senderId === myId) {
                return (
                  <div
                    key={msg.id}
                    className="bg-gradient-to-r from-myBlue to-myPink text-white text-xs self-end max-w-md shadow-md py-3 px-10 rounded-t-full rounded-bl-full border-2 border-white"
                  >
                    {msg.content}
                  </div>
                );
              } else
                return (
                  <div
                    key={msg.id}
                    className="bg-gray-300 text-xs self-start max-w-md shadow-md py-3 px-10 rounded-t-full rounded-br-full border-2 border-white"
                  >
                    {msg.content}
                  </div>
                );
            })}
          </FlipMove>
          <div ref={bottomeContainerRef} className="pb-36 flex"></div>
        </div>
      )}

      <div className="flex gap-1 md:gap-5">
        <div className="bg-white p-[2px] flex-1 rounded-full shadow-md flex items-center gap-2 border-2 border-e-gray-300">
          <Icon
            IconName={BsFillPeopleFill}
            className="text-gray-500 block md:hidden"
            reduceOpacityOnHover={false}
            size={15}
            onClick={() => dispatch(setRightSidebarOpen())}
          />
          <Icon
            IconName={BsFillEmojiSunglassesFill}
            className="text-gray-500 hidden md:block"
          />
          <Input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            name={`message to ${currentSelectedChat?.username}`}
            className="border-none outline-none text-sm md:text-[15px]"
            onKeyDown={checkEnter}
            disabled={createMsgLoading}
          />
          <Icon
            IconName={ImAttachment}
            className="text-gray-500 hidden md:block rotate-90"
          />
          <Icon
            IconName={BsFillCameraFill}
            className="text-gray-500 hidden md:block"
          />
        </div>

        <div className="flex items-center justify-center">
          <Icon
            onClick={handleSendMsg}
            IconName={BsFillSendFill}
            reduceOpacityOnHover={false}
            loading={createMsgLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatArea;
