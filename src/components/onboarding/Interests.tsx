import { alphabet } from "@/constants";
import TagSelector from "./InterestTag";

const Interests = () => {
  return (
    <>
      {alphabet.map((item, _) => (
        <div className=" mb-[0.8rem]" key={_}>
          <h1 className="text-[1.8rem]">{item.letter.toUpperCase()}</h1>
          <div className="space-y-[1rem]">
            {item.options.map((option, i) => (
              <TagSelector text={option} key={i} />
            ))}
          </div>
          <hr className="mt-[1.8rem]" />
        </div>
      ))}
    </>
  );
};

export default Interests;
