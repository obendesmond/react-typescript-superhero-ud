import React from "react";
import Button from "./Button";
import Icon from "./Icon";
import { MdAdd } from "react-icons/md";

const AddListBoard = () => {
  return (
    <>
      <Button text="Add New ListBoard" secondary className="hidden md:flex" />
      <Icon IconName={MdAdd} className="block md:hidden" />
    </>
  );
};

export default AddListBoard;
