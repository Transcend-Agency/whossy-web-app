import React from "react";

interface StatusProps {
  status: string;
}

const Status: React.FC<StatusProps> = ({ status }) => {
  return (
    <div
      className={`${
        status === "active"
          ? "text-[#09B45A] bg-[#103B24]"
          : "text-white bg-[#08080899]"
      } text-[1.4rem] rounded-[0.6rem] py-[0.6rem] px-[0.8rem]`}
      style={{
        border: status === "active" ? "1px solid #09B45A" : "",
      }}
    >
      {status}
    </div>
  );
};

export default Status;
