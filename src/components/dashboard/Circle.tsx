import { motion } from 'framer-motion';

interface CircleProps {
    percentage: number;
    imageUrl: string;
}

const Circle: React.FC<CircleProps> = ({ percentage, imageUrl }) => {
    return (
        <div className="flex h-[200px] w-[200px] self-center">
            <svg width="200" height="200">
                <defs>
                    <clipPath id="clip-circle">
                        <circle r="70" cx="100" cy="100" />
                    </clipPath>
                </defs>
                <g transform="rotate(-90, 100, 100)">
                    {/* Background circle */}
                    <circle
                        r="70"
                        cx="100"
                        cy="100"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth={10}
                        strokeDasharray="439.8"
                        strokeDashoffset="0"
                        className="text-gray-200"
                    />
                    {/* Animated progress circle */}
                    <motion.circle
                        r="70"
                        cx="100"
                        cy="100"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth={10}
                        strokeDasharray="439.8"
                        strokeDashoffset="0"
                        className="text-[#F2243E] rounded-full"
                        initial={{ strokeDashoffset: 440 }} // Start from 0%
                        animate={{ strokeDashoffset: 440 - (percentage * (440 / 100)) }} // Animate to percentage
                        transition={{ duration: 1, ease: "easeInOut" }} // Customize the transition
                    />
                </g>
                {/* Center the image inside the circle */}
                <image
                    href={imageUrl}
                    x="30"
                    y="30"
                    width="140"
                    height="140"
                    clipPath="url(#clip-circle)"
                    preserveAspectRatio="xMidYMid slice"
                />
            </svg>
        </div>
    );
};

export default Circle;