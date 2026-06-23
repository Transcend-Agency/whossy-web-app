import * as SwitchRadix from "@radix-ui/react-switch";
import React, { useEffect, useState } from "react";

interface SwitchProps {
  text: string;
  textColor?: string;
  checks?: boolean;
  setChecked?: (e: boolean) => void
}

const Switch: React.FC<SwitchProps> = ({
  text,
  textColor = "#8A8A8E",
  checks,
  setChecked,
}) => {

  const [check, setCheck] = useState<boolean>(checks ?? false);

  useEffect(() => {
    if (setChecked) {
      setChecked(check)
    }
  }, [check])

  useEffect(() => {
    setCheck(checks ?? false);
  }, [checks]);

  return (
    <form>
      <div className="flex items-center justify-between">
        <label
          className="w-full text-[#8A8A8E] leading-none pr-[15px]"
          style={{
            color: textColor,
          }}
          htmlFor={text}
        >
          {text}
        </label>
        <SwitchRadix.Root
          className="w-[45px] h-[25px] pl-2 bg-blackA6 cursor-pointer rounded-full relative shadow-[0_2px_5px] shadow-[#D9D9D9] focus:shadow-[#D9D9D9] data-[state=checked]:bg-black outline-none"
          id={text}
          checked={check}
          onCheckedChange={(e) => {setCheck(e)}}
        >
          <SwitchRadix.Thumb className="block w-[18px] h-[18px] bg-white rounded-full shadow-[0_2px_2px] shadow-blackA4 transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
        </SwitchRadix.Root>
      </div>
    </form>
  );
};

export default Switch;
