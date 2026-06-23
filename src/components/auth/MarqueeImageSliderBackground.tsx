import Marquee from "react-fast-marquee";
import { motion } from 'framer-motion';

const MarqueeImageSliderBackground = () => {
    const imageNumbers = Array.from({ length: 40 }, (_, i) => i + 1);

    return <motion.div
        
        className='marquee-background'>
        <div className='marquee-background__overlay'></div>
        <motion.div initial={{ scale: 1.1 }} animate={{ scale: 1, transition: { duration: 5, ease: 'easeOut' } }} className='marquee-background__container'>
            <Marquee speed={20}>
                {imageNumbers.slice(0, 10).map(image => (
                    <img key={image} src={`/assets/images/auth-bg/${image}.webp`} className='marquee-background__image' alt={``} />
                ))}
            </Marquee>
            <Marquee direction='right' speed={20}>
                {imageNumbers.slice(10, 20).map(image => (
                    <img key={image} src={`/assets/images/auth-bg/${image}.webp`} className='marquee-background__image' alt={``} />
                ))}
            </Marquee>
            <Marquee direction='left' speed={20}>
                {imageNumbers.slice(20, 30).map(image => (
                    <img key={image} src={`/assets/images/auth-bg/${image}.webp`} className='marquee-background__image' alt={``} />
                ))}
            </Marquee>
            <Marquee direction='right' speed={20}>
                {imageNumbers.slice(30, 40).map(image => (
                    <img key={image} src={`/assets/images/auth-bg/${image}.webp`} className='marquee-background__image' alt={``} />
                ))}
            </Marquee>
            <Marquee speed={20}>
                {imageNumbers.slice(0, 10).map(image => (
                    <img key={image} src={`/assets/images/auth-bg/${image}.webp`} className='marquee-background__image' alt={``} />
                ))}
            </Marquee>
            <Marquee direction='right' speed={20}>
                {imageNumbers.slice(10, 20).map(image => (
                    <img key={image} src={`/assets/images/auth-bg/${image}.webp`} className='marquee-background__image' alt={``} />
                ))}
            </Marquee>
            <Marquee direction='left' speed={20}>
                {imageNumbers.slice(20, 30).map(image => (
                    <img key={image} src={`/assets/images/auth-bg/${image}.webp`} className='marquee-background__image' alt={``} />
                ))}
            </Marquee>
            <Marquee direction='right' speed={20}>
                {imageNumbers.slice(30, 40).map(image => (
                    <img key={image} src={`/assets/images/auth-bg/${image}.webp`} className='marquee-background__image' alt={``} />
                ))}
            </Marquee>
        </motion.div>
    </motion.div>
}
export default MarqueeImageSliderBackground;
