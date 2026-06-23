import React from "react";
import Skeleton from "react-loading-skeleton";
import { motion } from "framer-motion";

interface CircleProps {
    percentage: number;
    imageUrl: string | null;
}

const Circle: React.FC<CircleProps> = ({ percentage, imageUrl }) => {
    return (
        <div className="relative flex items-center justify-center h-[180px] w-[180px]">
            {/* Animated Circular Progress Bar */}
            <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                    background: `conic-gradient(#F2243E ${percentage}%, #E5E5E5 ${percentage}%)`,
                }}
                initial={{ background: `conic-gradient(#F2243E 0%, #E5E5E5 0%)` }}
                animate={{
                    background: `conic-gradient(#F2243E ${percentage}%, #E5E5E5 ${percentage}%)`,
                }}
                transition={{
                    duration: 1, // Duration of the animation
                    ease: "easeInOut",
                }}
            ></motion.div>

            {/* Inner Circle with Image or Skeleton */}
            <div className="relative flex items-center justify-center h-[160px] w-[160px] rounded-full bg-white overflow-hidden">
                {!imageUrl ? (
                    <Skeleton width={"160px"} height={"160px"} circle />
                ) : (
                    <img
                        src={imageUrl}
                        alt="Circular Content"
                        className="h-full w-full object-cover"
                    />
                )}
            </div>
        </div>
    );
};

export default Circle;
