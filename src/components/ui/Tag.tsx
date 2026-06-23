import React from "react";

interface TagProps {
  arr: { image: string; text: string }[];
  active: string | undefined;
  setGender: (gender: string) => void;
}

const Tag: React.FC<TagProps> = ({ arr, active, setGender }) => {
  return (
    <div className="flex space-x-2">
      {arr.map((item, i) => (
        <div
          className={`${item.text === active ? "bg-black text-white" : "bg-white text-black"} py-2 rounded-lg px-3 gap-2 cursor-pointer text-[1.4rem] items-center w-fit flex`}
          onClick={() => setGender(item.text)}
          key={i}
        >
          <p>{item.text}</p>
        </div>
      ))}
    </div>
  );
};

export default Tag;
