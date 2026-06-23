import BottomNav from "./BottomNav";
import TopNav from "./TopNav";
import React from "react";

interface NavBarProps {
  children: React.ReactNode | React.ReactNode[];
}

const MobileNavBar: React.FC<NavBarProps> = ({ children }) => {
  return (
    <>
      <TopNav />
      {children}
      <BottomNav />
    </>
  );
};

export default MobileNavBar;
