import { toastErr, toastInfo } from "./toast";

const CatchErr = (err: { code?: string }) => {
  const { code } = err;
  if (code === "auth/invalid-email") toastErr("invalid email");
  else if (code === "auth/weak-password")
    toastErr("password should be atleast 6 characters");
  else if (code === "auth/user-not-found") toastErr("user not found");
  else if (code === "auth/email-already-in-use")
    toastErr("email already exists");
  else if (code === "auth/wrong-password") toastErr("wrong password");
  else if (code === "auth/requires-recent-login")
    toastInfo("logout and login before updating your profile");
  else if (code === "unavailable") toastErr("firebase client is offline");
  else if (code === "auth/invalid-login-credentials")
    toastErr("invalid credentials");
  else if (code === "auth/operation-not-allowed")
    toastErr("Can't change email now!");
  else toastErr("An error occured!");
  console.log(err, err.code);
};

export default CatchErr;
