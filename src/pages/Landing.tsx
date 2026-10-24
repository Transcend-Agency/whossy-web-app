import { useGSAP } from '@gsap/react';
import { MotionConfig, motion } from "framer-motion";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
// import { useNavigate } from 'react-router';
import Footer from '../components/landing/Footer';
import Navbar from '../components/landing/Navbar';
import Marquee from 'react-fast-marquee';
import { Link } from 'react-router-dom';
import useAccountEntry from '@/hooks/useAccountEntry';

// The phone layout of the features: one card per feature, stacked. Sized
// from the content and the screen width, never from the screen height, so a
// tall phone cannot push a card wider than the screen.
const MOBILE_FEATURES = [
    {
        title: 'Get Matched Faster',
        body: 'Our smart algorithm connects you with compatible matches in no time, so you can spend less time searching and more time building real connections.',
        image: '/assets/images/website/match.png',
        alt: 'The Whossy match screen',
    },
    {
        title: 'Find Your Match, Anywhere',
        body: 'From Africa to anywhere in the world, explore connections that feel right. Discover profiles tailored to your preferences and start your story today.',
        image: '/assets/images/website/chat.png',
        alt: 'A Whossy chat',
    },
    {
        title: 'Swipe, Explore, Connect',
        body: 'Discover unique connections as you swipe through an international community. Explore profiles tailored to your preferences, and watch sparks fly with every match.',
        image: '/assets/images/website/explore.png',
        alt: 'The Whossy explore screen',
    },
    {
        title: 'Speak Your Love Language',
        body: 'Instant messaging that adapts to your style. Whether deep or playful, our chat helps you express yourself and truly connect, no matter where you are.',
        image: '/assets/images/website/swipe.png',
        alt: 'Swiping on Whossy',
    },
];

const MobileWebsiteFeatures = () => (
    <div className='lg:hidden w-full px-[24px] pt-[64px] space-y-[72px]'>
        {MOBILE_FEATURES.map(({ title, body, image, alt }) => (
            <motion.section
                key={title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className='flex flex-col items-center text-center'
            >
                <h2 className='text-[22px] leading-[28px] font-bold'>{title}</h2>
                <p className='text-gray text-[15px] leading-[22px] mt-[8px] max-w-[360px]'>{body}</p>

                <svg className='mt-[12px]' width="24" height="51" viewBox="0 0 24 51" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M12 48V26.2989V1.78814e-07" stroke="#D9D9D9" strokeWidth="1.5" />
                    <circle cx="12" cy="39" r="10" fill="#FEFEFE" stroke="#FF5C00" strokeWidth="4" />
                    <circle cx="12" cy="39" r="6" fill="#FF5C00" />
                </svg>

                <img
                    src={image}
                    alt={alt}
                    loading='lazy'
                    width={917}
                    height={1857}
                    className='mt-[12px] w-auto h-auto max-w-[min(100%,340px)] max-h-[72svh] object-contain'
                />
            </motion.section>
        ))}
    </div>
);

const DesktopWebsiteFeatures = () => {
    gsap.registerPlugin(useGSAP);
    gsap.registerPlugin(ScrollTrigger);


    useGSAP(
        () => {
            const timeline = gsap.timeline({
                scrollTrigger: {
                    trigger: '.features-section',
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 1,

                },
            });
            // time
            timeline.fromTo('.bottom-right-text', {
                opacity: 0,
            }, { opacity: 1, duration: 1 })

            timeline.to('.bottom-right-text', {
                opacity: 0, duration: 0.3,
            })
            timeline.to('.image-2', {
                opacity: 1, duration: 0.3
            }, "<")
            timeline.fromTo('.top-left-text', {
                opacity: 0,
            }, { opacity: 1, duration: 1 })
            timeline.to('.top-left-text', {
                opacity: 0, duration: 0.3,
            })
            timeline.to('.image-3', {
                opacity: 1, duration: 0.3
            }, "<")
            timeline.fromTo('.top-right-text', {
                opacity: 0,
            }, { opacity: 1, duration: 1 })
            timeline.to('.top-right-text', {
                opacity: 0, duration: 0.3,
            })
            timeline.to('.image-4', {
                opacity: 1, duration: 0.3
            }, "<")
            timeline.fromTo('.bottom-left-text', {
                opacity: 0,
            }, { opacity: 1, duration: 1 })
        }
    );
    return (
        <div className='w-full'>
            <div className='w-full h-[400dvh] relative features-section hidden lg:block mt-[50px]'>
                <div className=' w-full sticky bottom-0 top-0 h-[100dvh] hidden lg:flex items-end justify-center'>
                    <div className='relative '>
                        <div className='lg:h-[94dvh] relative top-[8dvh] lg:aspect-[0.49] '>
                            <img className='h-[94dvh] absolute z-[0] image-1' src="/assets/images/website/match.png" />
                            <img className='h-[94dvh] absolute z-[1] image-2 opacity-0' src="/assets/images/website/chat.png" />
                            <img className='h-[94dvh] absolute z-[2] image-3 opacity-0' src="/assets/images/website/explore.png" />
                            <img className='h-[94dvh] absolute z-[3] image-4 opacity-0 ' src="/assets/images/website/swipe.png" />
                        </div>
                        <div className='absolute bottom-[80px] -right-[335px] xl:-right-[420px] bottom-right-text'>
                            <div className='relative w-fit'>
                                <svg width="123" height="61" viewBox="0 0 123 61" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M122 60L100.407 1H2.98023e-06" stroke="#D9D9D9" stroke-width="1.5" />
                                </svg>
                                <svg className='absolute -bottom-[8px] -right-[8px]' width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="16" cy="16" r="14" fill="#FEFEFE" stroke="#FF5C00" stroke-width="4" />
                                    <circle cx="16" cy="16" r="8" fill="#FF5C00" />
                                </svg>
                            </div>

                            <div className='relative xl:w-fit mx-auto ml-[43px] mt-[12px]'>
                                <h2 className='font-bold lg:text-[20px] xl:text-[24px] leading-[28.8px] mb-[12px]'>Get Matched Faster</h2>
                                <p className='font-normal lg:text-[14px] xl:text-[18px] leading-[21.6px] text-[#8A8A8E] max-w-[280px] xl:max-w-[349px]'>Our smart algorithm connects you with compatible matches in no time, so you can spend less time searching and more time building real connections.</p>
                            </div>
                        </div>

                        <div className='absolute top-[calc(80px+8dvh)] -right-[335px] xl:-right-[420px] top-right-text opacity-0'>
                            <div className='relative w-fit'>
                                <svg width="123" height="61" viewBox="0 0 123 61" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M122 60L100.407 1H2.98023e-06" stroke="#D9D9D9" stroke-width="1.5" />
                                </svg>
                                <svg className='absolute -bottom-[8px] -right-[8px]' width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="16" cy="16" r="14" fill="#FEFEFE" stroke="#FF5C00" stroke-width="4" />
                                    <circle cx="16" cy="16" r="8" fill="#FF5C00" />
                                </svg>

                            </div>
                            <div className='relative w-fit ml-[43px] mt-[12px]'>
                                <h2 className='font-bold lg:text-[20px] xl:text-[24px] leading-[28.8px] mb-[12px]'>Find Your Match, Anywhere</h2>
                                <p className='font-normal lg:text-[14px] xl:text-[18px] leading-[21.6px] text-[#8A8A8E] max-w-[280px] xl:max-w-[349px]'>From Africa to anywhere in the world, explore connections that feel right. Discover profiles tailored to your preferences and start your story today.</p>
                            </div>
                        </div>

                        <div className='absolute bottom-[80px] -left-[335px] xl:-left-[420px] flex flex-col items-end bottom-left-text opacity-0'>
                            <div className='relative w-fit'>
                                <svg width="123" height="61" viewBox="0 0 123 61" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 60L22.5929 1H123" stroke="#D9D9D9" stroke-width="1.5" />
                                </svg>

                                <svg className='absolute -bottom-[8px] -left-[8px]' width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="16" cy="16" r="14" fill="#FEFEFE" stroke="#FF5C00" stroke-width="4" />
                                    <circle cx="16" cy="16" r="8" fill="#FF5C00" />
                                </svg>
                            </div>
                            <div className='relative w-fit ml-[43px] mt-[12px] text-right'>
                                <h2 className='font-bold lg:text-[20px] xl:text-[24px] leading-[28.8px] mb-[12px]'>Swipe, Explore, Connect</h2>
                                <p className='font-normal lg:text-[14px] xl:text-[18px] leading-[21.6px] text-[#8A8A8E] max-w-[280px] xl:max-w-[349px]'>Discover unique connections as you swipe through an international community. Explore profiles tailored to your preferences, and watch sparks fly with every match.</p>
                            </div>
                        </div>

                        <div className='absolute top-[calc(8dvh+52.75px)] -left-[335px] xl:-left-[420px] flex flex-col items-end top-left-text opacity-0'>
                            <div className='relative w-fit'>
                                <svg width="123" height="61" viewBox="0 0 123 61" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 60L22.5929 1H123" stroke="#D9D9D9" stroke-width="1.5" />
                                </svg>

                                <svg className='absolute -bottom-[8px] -left-[8px]' width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="16" cy="16" r="14" fill="#FEFEFE" stroke="#FF5C00" stroke-width="4" />
                                    <circle cx="16" cy="16" r="8" fill="#FF5C00" />
                                </svg>

                            </div>
                            <div className='relative w-fit ml-[43px] mt-[12px] text-right'>
                                <h2 className='font-bold lg:text-[20px] xl:text-[24px] leading-[28.8px] mb-[12px]'>Speak Your Love Language</h2>
                                <p className='font-normal lg:text-[14px] xl:text-[18px] leading-[21.6px] text-[#8A8A8E] max-w-[280px] xl:max-w-[349px]'>Instant messaging that adapts to your style. Whether deep or playful, our chat helps you express yourself and truly connect, no matter where you are.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <MobileWebsiteFeatures />
        </div>


    )
}

// Six rows of photos: enough to cover the hero on tall phones, where five
// left a black band under the last row.
const MARQUEE_ROWS = [
    { images: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], direction: 'left' },
    { images: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40], direction: 'right' },
    { images: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], direction: 'left' },
    { images: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30], direction: 'right' },
    { images: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], direction: 'left' },
    { images: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40], direction: 'right' },
] as const;

const MarqueeImageSlider = () => {
    return <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ scale: { duration: 5, ease: 'easeOut' }, opacity: { duration: 0.6, ease: 'easeOut' } }}
        className='marquee-landing'>

        <div className='marquee-background__landing'>
            {MARQUEE_ROWS.map(({ images, direction }, row) => (
                <Marquee key={row} direction={direction} speed={20}>
                    {images.map(image => (
                        <img key={image} src={`/assets/images/auth-bg/${image}.webp`} className='marquee-background__image' alt='' />
                    ))}
                </Marquee>
            ))}
        </div>
    </motion.div>
}

const Landing = () => {
    const { signedIn, appPath } = useAccountEntry();

        return (
            <MotionConfig reducedMotion="user">
                <div className="flex flex-col items-center">
                    {/* FIRST PAGE */}
                    
                    {/* Fills the first screen exactly; svh so the mobile browser bar
                        showing or hiding does not resize it. */}
                    <section className='relative w-full h-[100svh] min-h-[560px] flex flex-col justify-center items-center overflow-hidden bg-black'>
                        <div className='absolute inset-0 flex items-center justify-center'>
                            <MarqueeImageSlider />
                        </div>
                        <div className='absolute inset-0 bg-[#080808] opacity-80 z-20' aria-hidden='true'></div>

                        <div className="fixed top-0 w-full z-50 pointer-events-none">
                            <Navbar />
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
                            className="relative z-30 flex flex-col items-center px-[24px] max-w-[600px]"
                        >
                            <h1 className="text-[34px] leading-[40px] sm:text-[4.8rem] sm:leading-[5.6rem] lg:text-[4rem] lg:leading-[4.8rem] text-white font-bold text-center">
                                Swipe, Match, Love - Your Perfect Partner Awaits!
                            </h1>

                            <div className='mt-[24px] w-full sm:w-auto'>
                                <button className="w-full sm:min-w-[36rem] lg:min-w-[48rem] whitespace-nowrap rounded-[8px] cursor-pointer bg-[#F2243E] py-[14px] px-[32px] text-white text-[16px] lg:text-[1.8rem] font-medium active:scale-[0.98] transition-all duration-200 flex items-center justify-center">
                                    Download Now
                                </button>
                            </div>

                            {/* Whossy also runs in the browser; say so where people look first. */}
                            {signedIn ? (
                                <Link
                                    to={appPath}
                                    className="mt-[12px] w-full sm:w-auto sm:min-w-[36rem] lg:min-w-[48rem] text-center rounded-[8px] border border-solid border-white/70 py-[13px] px-[32px] text-white text-[16px] lg:text-[1.8rem] font-medium hover:bg-white/10 transition-colors"
                                >
                                    Open Whossy
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/auth/create-account"
                                        className="mt-[12px] w-full sm:w-auto sm:min-w-[36rem] lg:min-w-[48rem] text-center rounded-[8px] border border-solid border-white/70 py-[13px] px-[32px] text-white text-[16px] lg:text-[1.8rem] font-medium hover:bg-white/10 transition-colors"
                                    >
                                        Create an account on the web
                                    </Link>
                                    <p className="mt-[16px] text-[15px] lg:text-[1.6rem] text-white/80 text-center">
                                        Already have an account?{" "}
                                        <Link to="/auth/login" className="font-bold text-white underline underline-offset-4">
                                            Log in
                                        </Link>
                                    </p>
                                </>
                            )}
                        </motion.div>
                    </section>

                    <DesktopWebsiteFeatures />
                    
                    <div className='w-full'>
                        <Footer />
                    </div>
                </div>
            </MotionConfig>
        )
    }
    export default Landing;