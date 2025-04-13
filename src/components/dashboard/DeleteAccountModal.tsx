import { AnimatePresence, motion } from 'framer-motion'
import React, { useState } from "react";
import toast from "react-hot-toast";

interface DeleteAccountModalProps {
	show: boolean;
	onCloseModal: () => void;
	onDeleteAccount: (password: string) => Promise<void>;
	passwordRequired: boolean;
}

const modalVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
	exit: { opacity: 0 }
};

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({show, onCloseModal, onDeleteAccount, passwordRequired}) => {
	const [password, setPassword] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);

	const handleDeleteAccount = async () => {
		if (!password.trim()) {
			toast.error("Please enter your password");
			return;
		}

		setLoading(true);
		try {
			await onDeleteAccount(password);
			onCloseModal();
		} catch (error) {
			toast.error("Error deleting account");
		} finally {
			setLoading(false);
			setPassword("");
		}
	};
	const disabledButton = loading || password.trim() === ""

	return (
		<AnimatePresence mode='wait'>
			{show && (
				<motion.div
					initial="hidden"
					animate="visible"
					exit="exit"
					variants={modalVariants}
					transition={{ duration: 0.3 }}
					className="fixed inset-0 flex justify-center items-center z-50 bg-[#b9b9b9] bg-opacity-50 w-full h-screen"
				>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
						className="bg-white text opacity-100 z-[9999] py-[2.8rem] px-[2.5rem] space-y-[2rem] rounded-[2rem] w-[470px]"
					>
						<div>
							<div className={`grid text-[14px]`}>
								<div className={`flex justify-between items-center`}>
									<p>Are you sure you want to delete your account ?</p>
									<img className={`size-[18px] cursor-pointer`} onClick={() => {
										onCloseModal();
										setPassword("")
									}}
										 src={`/assets/icons/close-icons.svg`} alt={``}/>
								</div>
								<div className="settings-page__settings-group__item-separator"></div>


								<div className={`p-4 bg-red bg-opacity-20 rounded-md flex gap-4 items-center my-3`}>
									<img className={`size-[20px]`} src={`/assets/icons/danger.svg`} alt={``}/>
									<p className={`leading-relaxed`}>Deleting this Account will delete all of its data and this action is not irreversible</p>
								</div>
									{passwordRequired &&
										<>
												<p className={`my-3 font-medium`}>Enter this account's password to confirm</p>
												<input
													type="password"
													name="password-input"
													id="password-input"
													className="bg-white border border-gray text-[2.1rem] focus:outline-none rounded-lg px-4 py-2 w-full my-2"
													value={password}
													onChange={(e) => setPassword(e.target.value)}
													disabled={loading}/>
										</>
									}
								<button
									onClick={handleDeleteAccount}
									className={`${loading ? "bg-[#F2243E] text-white" : "bg-[#F6F6F6]"} py-[1rem] w-full text-[1.2rem] font-bold text-center rounded-lg transition-all duration-300 ${disabledButton ? "cursor-not-allowed" : "cursor-pointer hover:bg-[#F2243E] hover:text-white"} whitespace-nowrap inline-block`}
									disabled={disabledButton}
								>
									{loading ? "Deleting..." : "Delete My Account"}
								</button>
							</div>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export default DeleteAccountModal;