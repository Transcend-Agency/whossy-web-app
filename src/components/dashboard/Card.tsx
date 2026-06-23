import { useState } from "react";
import { verifiedBg, verifiedTick } from "@/assets/icons";
import Icon from "../ui/Icon";
import Information from "./Information";
import Interests from "./Interests";
import Status from "./Status";

const Card = () => {
  const distance = 10;
  const age = 18;
  const [open, setOpen] = useState<boolean>(true);
  return (
      <div className="items-center flex flex-col w-full  px-[2rem] justify-center  bg-white flex-grow py-[3rem]">
        <section className="relative  max-w-[405px] rounded-3xl overflow-hidden">
          <img
            src="../../../assets/images/matches/stephen.png"
            alt="person image"
            className="w-full h-[605px]"
          />
          <div className="absolute bottom-0 space-y-[1.2rem] bg-gradient-to-t from-black">
            <span className="flex items-center text-white text-[1.4rem] px-[1.6rem] space-x-[0.8rem]">
              <Status status="Recent" />
              <p>~ {distance} mi away</p>
            </span>
            <div className="flex space-x-[0.8rem] items-center px-[1.6rem]">
              <h1 className="text-[2.4rem] text-white">
                <span className="font-bold">Jezreel,</span> {age}
              </h1>
              <Icon
                src={verifiedBg}
                src2={verifiedTick}
                color="#485FE6"
                color2="white"
              />
            </div>
            <div>
              <p className="text-white text-[1.4rem] px-[1.6rem]">
                I am very excited to meet new people and make friends. Let’s start
                with that and see where it takes us 🚀
              </p>
            </div>
            <Interests
              interestsFromFirebase={["Temidire", "Ronald", "Bamidele"]}
              getState={(state) => setOpen(state)}
            />
          </div>
        </section>
        <Information hide={open} />
      </div>
  );
};

export default Card;
