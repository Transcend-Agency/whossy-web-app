import { chat,  globalSearch,  heartBottom,  heartTop,  match,  profileBottom,  profileTop} from "@/assets/icons";
import Icon from "../ui/Icon";
import { useLocation, useNavigate } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const {pathname} = useLocation();
  return (
    <div className="sticky bottom-0 w-full bg-white text-white flex">
      {icons.map((icon) => (
        <div
          className={` w-full py-[2rem] flex justify-center`}
        >
          <Icon
            color={pathname === icon.route ? "#F2243E" : "#8A8A8E"}
            id={icon.name}
            src={icon.src}
            src2={icon.src2}
            className="cursor-pointer"
            onClick={() => navigate(icon.route)}
          />
        </div>
      ))}
    </div>
  );
};

export default BottomNav;

const icons = [
  { name: "match", src: match, route: "/dashboard/matches" },
  { name: "globalSearch", src: globalSearch, route: "/dashboard/globalSearch" },
  { name: "heart", src: heartTop, src2: heartBottom, route: "/dashboard/heart" },
  { name: "chat", src: chat, route: "/dashboard/chat" },
  {
    name: "profile",
    src: profileTop,
    src2: profileBottom,
    route: "/dashboard/user-profile",
  },
];
