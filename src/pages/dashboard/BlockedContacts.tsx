import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { arrayRemove, getDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuthStore } from "@/store/UserId.tsx";
import toast from "react-hot-toast";

interface BlockedContactsProps {
	activePage: boolean;
	closePage: () => void;
}

interface BlockedUser {
	id: string;
	firstName: string;
	lastName: string;
}

const BlockedContacts: React.FC<BlockedContactsProps> = ({ activePage, closePage }) => {
	const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);
	const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
	const { user } = useAuthStore();

	// Unblock a user
	const handleUnblock = async (blockedUser: BlockedUser) => {
		setUnblockingUserId(blockedUser.id);
		if (!user?.uid) return;
		try {
			const userRef = doc(db, "users", user.uid);

			// Remove blockedUser.id from the blockedIds array
			await updateDoc(userRef, {
				blockedIds: arrayRemove(blockedUser.id)
			});

			// Update UI by removing the unblocked user from the state
			setBlockedUsers(prevUsers => prevUsers.filter(user => user.id !== blockedUser.id));
			toast.success(`${blockedUser.firstName} has been unblocked successfully.`);
		} catch (error) {
			console.error("Error unblocking user:", error);
		} finally {
			setUnblockingUserId(null);
		}
	};

	useEffect(() => {
		// Fetch blocked users
		const fetchBlockedUsers = async () => {
			if (!user?.uid) return;
			try {
				const userRef = doc(db, "users", user.uid);
				const userDoc = await getDoc(userRef);

				if (userDoc.exists()) {
					const userData = userDoc.data();
					const blockedIds = userData?.blockedIds || [];

					// Fetch user details for each blocked ID
					const blockedUsersData = await Promise.all(
						blockedIds.map(async (blockedId: string) => {
							const blockedUserRef = doc(db, "users", blockedId);
							const blockedUserSnapshot = await getDoc(blockedUserRef);

							if (blockedUserSnapshot.exists()) {
								const userData = blockedUserSnapshot.data();
								return {
									id: blockedId,
									firstName: userData.first_name,
									lastName: userData.last_name,
								};
							}
							return null;
						})
					);

					// Filter out any null entries in case of missing data
					setBlockedUsers(blockedUsersData.filter((user): user is BlockedUser => user !== null));
				}
			} catch (error) {
				console.error("Error fetching blocked users:", error);
			}
		};

		// Fetch blocked users when component mounts or user ID changes
		fetchBlockedUsers().catch((error) => console.error("Failed to fetch blocked users:", error));

	}, [user?.uid]);

	return (
		<motion.div
			animate={activePage ? { x: "-100%", opacity: 1 } : { x: 0 }}
			transition={{ duration: 0.25 }}
			className="dashboard-layout__main-app__body__secondary-page blocked-contacts-page z-20 font-neue-montreal"
		>
			<div className="bg-white h-full">
				<div className="flex items-center settings-page__title">
					<button onClick={closePage} className="flex gap-[1rem] cursor-pointer items-center">
						<img src="/assets/icons/back-arrow-black.svg" alt="Back" />
						<p>Blocked Contacts</p>
					</button>
				</div>

				<div>
					{blockedUsers.length > 0 ? (
						blockedUsers.map((blockedUser) => (
							<div key={blockedUser.id} className="rounded-sm border border-b-[#D9D9D9] mb-1">
								<div className="blocked-contact p-6 flex items-center bg-[#F4F4F4] justify-between px-10 border-[1px] border-b-[#D9D9D9]">
									<p className="tracking-wider text-[1.75rem]">
										{blockedUser.firstName} {blockedUser.lastName}
									</p>

									{unblockingUserId === blockedUser.id ? (
										<div className="bg-red text-[1.35rem] flex justify-center items-center cursor-pointer text-white border-none px-6 py-4 w-[75px] h-[30px] rounded-md">
											<motion.img key="loading-image" className='button__loader'
														src='/assets/icons/loader.gif'/>
										</div>
									) : (
										<button
											onClick={() => handleUnblock(blockedUser)}
											className="bg-red text-[1.35rem] text-center cursor-pointer text-white border-none w-[75px] h-[30px] rounded-md">
											Unblock
										</button>
									)}

								</div>
							</div>
						))
					) : (
						<div className={`grid items-center text-center place-items-center text-3xl gap-8 pt-[20rem]`}>
							<img className={`size-[50px]`} src={`/assets/icons/block.svg`} alt={``} />
							<p>No blocked contacts</p>
						</div>
					)}
				</div>
			</div>
		</motion.div>
	);
};

export default BlockedContacts;
