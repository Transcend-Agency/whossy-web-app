import React from 'react';

type SettingsGroupProps = {
    data: [string, string | undefined, () => void][]
};

const SettingsGroup: React.FC<SettingsGroupProps> = ({ data }) => {

    return <div className="settings-page__settings-group">
        {data.map((item, index) => (
            <button key={index} onClick={item[2]} className="settings-page__settings-group__item">
                <div className="settings-page__settings-group__item-container">
                    <div className="settings-page__settings-group__item__label ml-[1.3rem]">{item[0]}</div>
                    {item[1] !== undefined ? <div className="settings-page__settings-group__item__value mr-[1.3rem]">{item[1].length > 40 ? item[1].substring(0, 40) + '...' : item[1]}{(item[0] !== "Birthday" && item[0] !== "Email" && item[0] !== 'Gender') && <img src="/assets/icons/arrow-right.svg" alt={``}/>}</div> : <div className='flex items-center gap-x-3 mr-[1.3rem]'>
                        <div className='settings-page__settings-group__item__value'>Choose</div>
                        <img src="/assets/icons/arrow-right.svg" alt={``}/>
                    </div>}
                </div>
                {index !== data.length - 1 && <div className="settings-page__settings-group__item-separator"></div>}
            </button>
        ))}
    </div>
}
export default SettingsGroup;
