import React from 'react';

type SettingsInterestsProps = {
    title: string;
    isPremium?: boolean;
    onButtonPress?: () => void;
};

const SettingsInterest: React.FC<SettingsInterestsProps> = ({ title, isPremium, onButtonPress }) => {
    return (<div className="settings-page__settings-group__toggle-item" onClick={onButtonPress}>
        <div className="settings-page__settings-group__toggle-item-container items-center">
            <div className="settings-page__settings-group__toggle-item__content ">
                <div className="settings-page__settings-group__toggle-item__single-text">{title} {isPremium && <div className="premium-badge">Premium</div>}</div>
            </div>
            <img className='hover:scale-[1.1] transition ease-in duration-200 cursor-pointer' src="/assets/icons/add.svg" alt="" />
        </div>
        <div className="settings-page__settings-group__item-separator"></div>
    </div>)
}
export default SettingsInterest;