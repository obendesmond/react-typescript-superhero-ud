import React from "react";

type SidebarTypes = {
  children?: JSX.Element;
  isRight?: boolean;
  className?: string;
};

function Sidebar({ children, isRight, className }: SidebarTypes) {
  return (
    <div
      className={`lg:flex-[0.3] duration-75 bg-white shadow-md border-2 overflow-scroll ${
        isRight
          ? "rounded-tr-3xl rounded-br-3xl"
          : "rounded-tl-3xl rounded-bl-3xl"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default Sidebar;
