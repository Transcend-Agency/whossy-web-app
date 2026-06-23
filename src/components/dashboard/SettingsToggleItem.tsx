import React from 'react';
import toast from 'react-hot-toast';

type SettingsToggleItemProps = {
    title: string;
    subtext?: string;
    isPremium?: boolean;
    onButtonToggle: () => void;
    isActive: boolean;
};

const SettingsToggleItem: React.FC<SettingsToggleItemProps> = ({ onButtonToggle, title, isPremium, subtext, isActive }) => {

    return (<div className="settings-page__settings-group__toggle-item">
        <div className="settings-page__settings-group__toggle-item-container">
            <div className="settings-page__settings-group__toggle-item__content">
                {subtext ?
                    <>
                        <div className="settings-page__settings-group__toggle-item__title">{title} {isPremium && <div className="premium-badge">Premium</div>}</div>
                        <div className="settings-page__settings-group__toggle-item__subtext">{subtext}</div>
                    </> :
                    <div className="settings-page__settings-group__toggle-item__single-text">
                        {title} {!isPremium && <div className="premium-badge">Premium</div>}
                    </div> }
            </div>
            <div className={`settings-page__settings-group__toggle-item__toggle-button ${isActive && 'settings-page__settings-group__toggle-item__toggle-button--active'}`}
                 onClick={() => {
                     if (!isPremium || title === "Public search" || title === "Read receipts") {
                         onButtonToggle();
                     } else {
                         toast.error('This setting is only available to premium users.');
                     }
                 }}>
                <div className="settings-page__settings-group__toggle-item__toggle-button__toggle"></div>
            </div>
        </div>
        <div className="settings-page__settings-group__item-separator"></div>
    </div>)
}
export default SettingsToggleItem;