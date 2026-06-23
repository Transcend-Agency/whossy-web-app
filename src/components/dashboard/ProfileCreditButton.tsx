import React from 'react';

type ProfileCreditButtonProps = {
    description: string;
    linkText: string;
    onLinkClick: () => void;
    imgSrc: string
};


const ProfileCreditButton: React.FC<ProfileCreditButtonProps> = ({ description, linkText,  imgSrc, onLinkClick }) => {


    return <div className='user-profile__credit-buttons__button'>
        <img src={imgSrc} alt={``}/>
        <div className='user-profile__credit-buttons__button__text'>
            <p className='user-profile__credit-buttons__button__description'>
                {description}
            </p>
            <button className='user-profile__credit-buttons__button__link' onClick={onLinkClick}>{linkText}</button>

        </div>
    </div>
}

export default ProfileCreditButton;
