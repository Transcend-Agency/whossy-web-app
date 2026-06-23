import React from 'react';
interface SkeletonProps {
	height: string;
	width: string;
	borderRadius?: string;
}

const SkeletonNotification: React.FC<SkeletonProps> = ({ height, width, borderRadius = '0.5rem' }) => {
	return (
		<div
			style={{
				height,
				width,
				borderRadius,
				backgroundColor: '#E0E0E0',
				animation: 'pulse 1.5s ease-in-out infinite',
			}}
			className="skeleton-loader"
		/>
	);
};

export default SkeletonNotification;
