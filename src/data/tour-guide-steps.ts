import {Tour} from "@/types/tourGuide.ts";

export const tourGuideSteps: Tour = {
		'explore' : [
				{
						selector: '.nav-explore',
						content: 'Explore profiles based on your selected preferences (male, female, or everyone). You can view profiles and apply filters to narrow your search results.',
				},
				{
						selector: '.nav-swipe-and-match',
						content: 'Swipe through profiles one at a time, based on your selected preferences. Swipe right to like a profile, or left to dislike it.',
				},
				{
						selector: '.nav-matches',
						content: 'View all the likes you’ve received and the matches you’ve made with other users on the platform.',
				},
				{
						selector: '.nav-chat',
						content: 'Chat with other users, whether they are your matches or not. Connect and start conversations easily.',
				},
				{
						selector: '.nav-user-profile',
						content: 'View and edit your personal profile. Update your picture, modify details, manage subscriptions, and buy credits directly from here.',
				},
				{
						selector: '.nav-notification',
						content: 'Check your notifications, including new likes, matches, and any other updates on your activity.',
				},
				{
						selector: '.advanced-search-btn',
						content: 'Set your advanced search preferences, such as gender, location, and other filters to refine your search experience.',
				},
				{
						selector: '.advanced-search-btn2',
						content: 'Confirm and apply the advanced search settings and preferences you’ve updated for them to take effect.',
				},
				{
						selector: '.dashboard-layout__matches-wrapper',
						content: 'Review the matches you’ve made with other users on the platform, based on mutual interest and likes.',
				},
				{
						selector: '[data-cy="chat-interface-modal"]',
						content: 'This is the chat interface where you interact with profiles liked or matched. Enjoy seamless ' +
								' communication with those you connect with.',
				},
		],
		'swipe-and-match' : [
				{
						selector: '[data-cy="dislike-profile"]',
						content: 'Use this button to indicate that you\'re not interested in a profile. This helps refine your recommendations.'
				},
				{
						selector: '[data-cy="like-profile"]',
						content: 'Tap this button to like a profile that interests you. A mutual like will create a match!'
				},
				{
						selector: '[data-cy="chat-profile"]',
						content: 'Click here to start a conversation with this profile once you\'ve matched.'
				},
				{
						selector: '[data-cy="expand-profile-card"]',
						content: 'Click this arrow to view more details about the user\'s profile, including their bio and' +
								' interests.'
				},
				{
						selector: '[data-cy="control-button"]',
						content: 'This button lets you access additional options, such as reporting or blocking a profile for safety.'
				}
		],
		'matches' : [
				{
						selector: '[data-cy="likes-page"]',
						content: "This is the Likes page where you can view the profiles of users who have liked you. Explore these profiles and decide who you'd like to connect with."
				},
				{
						selector: '[data-cy="matches-page"]',
						content: "This is the Matches page where you can see users you've mutually matched with. Start chatting or view their profiles to learn more about them."
				},
				{
						selector: '[data-cy="subscribe-modal-cta"]',
						content: "This is the subscription modal where you can unlock premium features to enhance your matching and chatting experience."
				}
		],
		'chat' : [],
		'user-profile': [
				{
						selector: '[data-cy=profile-settings-button]',
						content: 'Click here to access your profile settings and update your personal information or preferences.',
				},
				{
						selector: '[data-cy=update-profile-button]',
						content: 'Use this button to edit your profile details and showcase your best self to potential matches.',
				},
				{
						selector: '[data-cy=update-profile-btn2]',
						content: 'This option allows you to make quick updates to your profile pictures and bio.',
				},
				{
						selector: '[data-cy=whossy-safety-guide]',
						content: 'Click here to view our safety guide for tips on secure and enjoyable interactions within the app.',
				},
				{
						selector: '[data-cy=buy-credit-modal]',
						content: 'Need more credits? Open this modal to explore credit packages and enhance your app experience.',
				},
				{
						selector: '[data-cy=subscription-modal]',
						content: 'Unlock premium features by subscribing to our plans. Click here to learn more.',
				}
		]
}

export const mobileTourSteps: Tour = {
		'explore' : [
				{
						selector: '[data-cy="nav-explore-mobile"]',
						content: 'Explore profiles based on your selected preferences (male, female, or everyone). You can view profiles and apply filters to narrow your search results.',
				},
				{
						selector: '[data-cy="nav-swipe-and-match-mobile"]',
						content: 'Swipe through profiles one at a time, based on your selected preferences. Swipe right to like a profile, or left to dislike it.',
				},
				{
						selector: '[data-cy="nav-matches-mobile"]',
						content: 'View all the likes you’ve received and the matches you’ve made with other users on the platform.',
				},
				{
						selector: '[data-cy="nav-chat-mobile"]',
						content: 'Chat with other users, whether they are your matches or not. Connect and start conversations easily.',
				},
				{
						selector: '[data-cy="nav-user-profile-mobile"]',
						content: 'View and edit your personal profile. Update your picture, modify details, manage subscriptions, and buy credits directly from here.',
				},
				{
						selector: '[data-cy="advanced-search-btn-mobile"]',
						content: 'Set your advanced search preferences, such as gender, location, and other filters to refine your search experience.',
				},
				{
						selector: '.advanced-search-btn2',
						content: 'Confirm and apply the advanced search settings and preferences you’ve updated for them to take effect.',
				},
		],
		'swipe-and-match' : [
				{
						selector: '[data-cy="dislike-profile"]',
						content: 'Use this button to indicate that you\'re not interested in a profile. This helps refine your recommendations.'
				},
				{
						selector: '[data-cy="like-profile"]',
						content: 'Tap this button to like a profile that interests you. A mutual like will create a match!'
				},
				{
						selector: '[data-cy="chat-profile"]',
						content: 'Click here to start a conversation with this profile once you\'ve matched.'
				},
				{
						selector: '[data-cy="expand-profile-card"]',
						content: 'Click this arrow to view more details about the user\'s profile, including their bio and' +
								' interests.'
				},
				{
						selector: '[data-cy="control-button"]',
						content: 'This button lets you access additional options, such as reporting or blocking a profile for safety.'
				}
		],
		'matches' : [
				{
						selector: '[data-cy="likes-page"]',
						content: "This is the \"Liked Me\" page where you can view the profiles of users who have liked you." +
								" Explore these profiles and decide who you'd like to connect with."
				},
				{
						selector: '[data-cy="matches-page"]',
						content: "This is the Matches page where you can see users you've mutually matched with. Start chatting or view their profiles to learn more about them."
				},
				{
						selector: '[data-cy="liked-by-page"]',
						content: "This is the \"Liked Me\" page where you can view the profiles of users who you have liked"},
		],
		'chat' : [],
		'user-profile': [
				{
						selector: '[data-cy=profile-settings-button]',
						content: 'Click here to access your profile settings and update your personal information or preferences.',
				},
				{
						selector: '[data-cy=update-profile-button]',
						content: 'Use this button to edit your profile details and showcase your best self to potential matches.',
				},
				{
						selector: '[data-cy=update-profile-btn2]',
						content: 'This option allows you to make quick updates to your profile pictures and bio.',
				},
				{
						selector: '[data-cy=whossy-safety-guide]',
						content: 'Click here to view our safety guide for tips on secure and enjoyable interactions within the app.',
				},
				{
						selector: '[data-cy=buy-credit-modal]',
						content: 'Need more credits? Open this modal to explore credit packages and enhance your app experience.',
				},
				{
						selector: '[data-cy=subscription-modal]',
						content: 'Unlock premium features by subscribing to our plans. Click here to learn more.',
				}
		]
}


export const styles = {
		popover: (base: any) => ({
				...base,
				'--reactour-accent': 'linear-gradient(90deg, #F2243E, #FB923C)',
				borderRadius: '12px',
				padding: '24px',
				height: '160px',
				width: '240px',
				fontSize: '16px',
				boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
		}),
		maskArea: (base: any) => ({
				...base,
				rx: '8px',
				zIndex: 9999
		}),
		badge: (base: any) => ({
				...base,
				background: 'linear-gradient(90deg, #F2243E, #FB923C)',
				padding: '5px 10px',
				borderRadius: '9999px',
				fontSize: '14px',
				fontWeight: 'bold',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				width: '20px',
				height: '20px',
		}),
		controls: (base: any) => ({
				...base,
				display: 'flex',
				justifyContent: 'space-between',
				marginTop: '40px',
				position: 'absolute',
				bottom: '8px',
				left: '12px',
				right: '12px',
		}),
		button: (base: any) => ({
				...base,
				padding: '3px 6px',
				borderRadius: '9999px',
				background: 'linear-gradient(90deg, #F2243E, #FB923C)',
				color: '#ffffff',
				border: 'none',
				cursor: 'pointer',
				fontSize: '26px',
				fontWeight: '500',
				transition: 'transform 0.2s ease',
				display: 'flex',
				alignItems: 'center',
				gap: '4px',
				'&:hover': {
						transform: 'scale(1.05)',
				},
		}),
		close: (base: any) => ({
				...base,
				right: '10px',
				top: '5px',
				width: '21px',
				height: '21px',
				color: '#6B7280',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				borderRadius: '50%',
				border: '1px solid #E5E7EB',
				transition: 'background-color 0.2s ease',
				'&:hover': {
						backgroundColor: '#F3F4F6',
						color: '#111827',
				},
		}),
}