import { motion } from "framer-motion";
import React from "react";

interface DiscoveryStateMessageProps {
	icon?: string;
	title: string;
	subtitle?: string;
	actionLabel?: string;
	onAction?: () => void;
}

/**
 * Shared error/empty state for discovery screens (C4). Before this, a failed
 * fetch on Explore left stale results on screen with no indication anything
 * went wrong, and the swipe deck could spin forever — from the outside, a
 * broken filter and a working one looked identical. Reuses the existing
 * empty-state/__icon/__text classes (explore.scss) so it matches the
 * "No Search Results" state it's replacing/extending.
 */
const DiscoveryStateMessage: React.FC<DiscoveryStateMessageProps> = ({
	icon = "/assets/icons/like-empty-state.png",
	title,
	subtitle,
	actionLabel,
	onAction,
}) => (
	<motion.div
		initial={{ opacity: 0 }}
		animate={{ opacity: 1 }}
		exit={{ opacity: 0 }}
		className="empty-state"
	>
		<img className="empty-state__icon" src={icon} alt="" />
		<div className="empty-state__text">{title}</div>
		{subtitle && <p className="text-[1.4rem] text-[#8A8A8E] mt-[0.8rem] text-center px-[2rem]">{subtitle}</p>}
		{actionLabel && onAction && (
			<button
				onClick={onAction}
				className="mt-[1.6rem] text-[1.4rem] font-medium text-[#485FE6]"
			>
				{actionLabel}
			</button>
		)}
	</motion.div>
);

export default DiscoveryStateMessage;
