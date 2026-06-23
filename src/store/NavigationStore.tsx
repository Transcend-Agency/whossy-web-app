import { create } from 'zustand';

type NavigationState = {
	activePage: 'user-profile' | 'edit-profile' | 'add-credits' | 'profile-settings' | 'preferences' | 'safety-guide' | 'interests' | 'user-interests' | 'subscription-plans'
	setActivePage: (page: 'user-profile' | 'edit-profile' | 'add-credits' | 'profile-settings' | 'preferences' | 'safety-guide' | 'interests' | 'user-interests' | 'subscription-plans') => void;
};


export const useNavigationStore = create<NavigationState>(
		(set) => ({
			activePage: 'user-profile',
			setActivePage: (page) => set({ activePage: page }),
		}),
);
