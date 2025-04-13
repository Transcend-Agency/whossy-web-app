import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/opacity.css';
import { motion } from 'framer-motion'
import {FC } from "react";

interface ExploreGridProfileProps {
    profile_image?: string
    distance?: string;
    first_name: string;
    age: number;
    onProfileClick: () => void
    isVerified?: boolean;
    hasBeenLiked?: boolean
    isNewUser?: boolean
}

const ExploreGridProfile: FC<ExploreGridProfileProps> = ({profile_image, distance, first_name, age, onProfileClick, isVerified, hasBeenLiked, isNewUser
}) => {

    return (
        <div onClick={onProfileClick} className='min-h-[20rem] h-[20rem] w-full rounded-[0.8rem] overflow-hidden relative transition duration-200 active:scale-100 cursor-pointer block mb-[0.8rem] explore-grid__profile2 group'>
            <figure className='w-full h-full transition-all duration-[0.3s] bg-[#ebebeb] group-hover:scale-110'>
                <LazyLoadImage
                    className='w-full h-full object-cover min-h-[20rem]'
                    height={'100%'}
                    effect="opacity"
                    src={profile_image || '/assets/images/profile/profile-pic-placeholder.png'}
                    width={'100%'} />
                <div className='w-full h-full absolute inset-0 bg-gradient-to-b from-[transparent] to-black from-60% to-85% z-10' />
            </figure>
            <div className={`absolute top-0 right-0 w-full`}>
                <div className={`flex items-center justify-between p-3`}>
                    <div className="text-white flex flex-col h-[3rem] gap-x-2 gap-y-2">
                        {isNewUser && <figure className='flex gap-x-3 text-[13px] items-center bg-red w-fit rounded-md p-2'>
                            <img className={`size-[8.5px]`} src="/assets/icons/leaf.svg" alt={``} /> New
                        </figure>}
                        {distance && <span className={`text-[10px]`}>~{distance} miles</span>}
                    </div>
                    {hasBeenLiked && <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="size-[20px] block" src="/assets/icons/heart.svg" />}
                </div>
            </div>
            <div className={`absolute bottom-0 right-0 w-full z-20 text-white tracking-wide pb-4 pl-3`}>
                <div>
                    <div className='flex items-center justify-between pr-3'>
                        <div>
                            <span className='text-[16px] md:text-[18px] lg:text-[20px] font-bold'>
                                {first_name.length >= 8 ? `${first_name.slice(0,7)}... ` : first_name},
                            </span>
                            <span className='text-[14px] md:text-[16px]'> {age}</span>
                        </div>
                        {isVerified && <img src='/assets/icons/verified.svg' className={`size-[18px]`} alt={``} />}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExploreGridProfile;