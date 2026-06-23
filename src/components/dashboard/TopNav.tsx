import { filter, settings } from "@/assets/icons";
import Icon from "../ui/Icon";
import React from "react";

interface TopNavProps {
  onSettings?: () => void;
  onPreferences?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({onSettings, onPreferences}) => {
  return (
    <div className="flex justify-end sticky top-0 bg-white p-[1rem] space-x-[1.5rem]">
      <Icon
        src={settings}
        className="cursor-pointer"
        onClick={onSettings}
      />
      <Icon src={filter} className="cursor-pointer" onClick={onPreferences}/>
    </div>
  );
};

export default TopNav;
