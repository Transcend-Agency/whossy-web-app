import React from 'react';

type ProgressBarItemProps = {
    active: boolean
};

const ProgressBarItem: React.FC<ProgressBarItemProps> = ({ active }) => {

    return <div className={`onboarding-page__progress-bar__item ${active && 'onboarding-page__progress-bar__item--active'}`} />
}
export default ProgressBarItem;