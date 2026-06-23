import {FC} from "react";

interface SkeletonProps {
  height: string;
  width: string;
  className?: string;
}

const Skeleton: FC<SkeletonProps> = ({ height = 4, width = 16, className }) => {
  return (
    <div className="animate-pulse">
      <div
        className={`bg-[#8A8A8E]/70 ${className ? className : ""}`}
        style={{ height, width }}
      ></div>
    </div>
  );
};

export default Skeleton;