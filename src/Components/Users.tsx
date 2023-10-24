import React from "react";
import { UsersLoader } from "./Loaders";
import FlipMove from "react-flip-move";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../Redux/store";
import UserHeaderProfile from "./UserHeaderProfile";
import { setAlertProps } from "../Redux/userSlice";

type UsersPropTypes = {
  loading: boolean;
};

function Users({ loading }: UsersPropTypes) {
  const users = useSelector((state: RootState) => state.user.users);
  const dispatch = useDispatch<AppDispatch>();

  const handleStartChat = (r_id: string, r_name: string) => {
    dispatch(
      setAlertProps({ open: true, recieverId: r_id, recieverName: r_name })
    );
  };

  return loading ? (
    <UsersLoader />
  ) : users.length === 0 ? (
    <div className="p-10">
      No user registered apart from you 😂, tell others to register and start
      chatting
    </div>
  ) : (
    <FlipMove>
      {users.map((u) => (
        <UserHeaderProfile
          handleClick={() => handleStartChat(u.id, u.username)}
          key={u.id}
          user={u}
          otherUser
        />
      ))}
    </FlipMove>
  );
}

export default Users;
