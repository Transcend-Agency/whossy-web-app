import { useGSAP } from '@gsap/react';
import { motion } from "framer-motion";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
// import { useNavigate } from 'react-router';
import Footer from '../components/landing/Footer';
import Navbar from '../components/landing/Navbar';
import Marquee from 'react-fast-marquee';

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
        <div className=''>
            <div className='w-screen h-[400dvh] relative features-section hidden lg:block mt-[50px]  '>
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

            <div className='block lg:hidden space-y-[8rem] pt-[20rem]'>
                <div className="h-[90dvh] relative top-[10dvh] aspect-[0.49] px-[5rem] ">
                    <div className="flex flex-col items-center justify-center bg-white">
                        <h1 className="text-[2rem] font-bold text-center">Get Matched Faster</h1>
                        <p className="text-gray text-[1.6rem] leading-[1.68rem] text-center px-6 mt-4">
                            Our smart algorithm connects you with compatible matches in no time,
                            so you can spend less time searching and more time building real connections.
                        </p>

                        <svg className='mt-3' width="24" height="51" viewBox="0 0 24 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 48V26.2989V1.78814e-07" stroke="#D9D9D9" stroke-width="1.5" />
                            <circle cx="12" cy="39" r="10" fill="#FEFEFE" stroke="#FF5C00" stroke-width="4" />
                            <circle cx="12" cy="39" r="6" fill="#FF5C00" />
                        </svg>

                        <div className="mt-3">
                            <img
                                src="/assets/images/website/match.png" alt="Matched Profile" />
                        </div>
                    </div>
                </div>


                <div className='h-[90dvh] relative top-[10dvh] aspect-[0.49] px-[5rem]'>
                    <div className="flex flex-col items-center justify-center bg-white">
                        <h1 className="text-[2rem] font-bold text-center">Find Your Match, Anywhere</h1>
                        <p className="text-gray text-[1.6rem] leading-[1.68rem] text-center px-6 mt-4">
                            From Africa to anywhere in the world, explore connections that feel right. Discover profiles tailored to your preferences and start your story today.
                        </p>

                        <svg className='mt-3' width="24" height="51" viewBox="0 0 24 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 48V26.2989V1.78814e-07" stroke="#D9D9D9" stroke-width="1.5" />
                            <circle cx="12" cy="39" r="10" fill="#FEFEFE" stroke="#FF5C00" stroke-width="4" />
                            <circle cx="12" cy="39" r="6" fill="#FF5C00" />
                        </svg>

                        <div className="mt-3">
                            <img
                                src="/assets/images/website/chat.png"
                                alt="Matched Profile"
                                className=""
                            />
                        </div>
                    </div>
                </div>

                <div className='h-[90dvh] relative top-[10dvh] aspect-[0.49] px-[5rem]'>
                    <div className="flex flex-col items-center justify-center bg-white">
                        <h1 className="text-[2rem] font-bold text-center">Swipe, Explore, Connect</h1>
                        <p className="text-gray text-[1.6rem] leading-[1.68rem] text-center px-6 mt-4">
                            Discover unique connections as you swipe through an international community. Explore profiles tailored to your preferences, and watch sparks fly with every match.
                        </p>

                        <svg className='mt-3' width="24" height="51" viewBox="0 0 24 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 48V26.2989V1.78814e-07" stroke="#D9D9D9" stroke-width="1.5" />
                            <circle cx="12" cy="39" r="10" fill="#FEFEFE" stroke="#FF5C00" stroke-width="4" />
                            <circle cx="12" cy="39" r="6" fill="#FF5C00" />
                        </svg>

                        <div className="mt-3">
                            <img
                                src="/assets/images/website/explore.png"
                                alt="Matched Profile"
                                className=""
                            />
                        </div>
                    </div>
                </div>

                <div className='h-[90dvh] relative top-[10dvh] aspect-[0.49] px-[5rem] '>
                    <div className="flex flex-col items-center justify-center bg-white">
                        <h1 className="text-[2rem] font-bold text-center">Speak Your Love Language</h1>
                        <p className="text-gray text-[1.6rem] leading-[1.68rem] text-center px-6 mt-4">
                            Instant messaging that adapts to your style. Whether deep or playful, our chat helps you express yourself and truly connect, no matter where you are.
                        </p>

                        <svg className='mt-3' width="24" height="51" viewBox="0 0 24 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 48V26.2989V1.78814e-07" stroke="#D9D9D9" stroke-width="1.5" />
                            <circle cx="12" cy="39" r="10" fill="#FEFEFE" stroke="#FF5C00" stroke-width="4" />
                            <circle cx="12" cy="39" r="6" fill="#FF5C00" />
                        </svg>

                        <div className="mt-3 ">
                            <img
                                src="/assets/images/website/swipe.png"
                                alt="Matched Profile"
                                className=""
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>


    )
}

const MarqueeImageSlider = () => {
    const imageNumbers = Array.from({ length: 40 }, (_, i) => i + 1);

    return <motion.div
        initial={{ scale: 1.1 }} animate={{ scale: 1, transition: { duration: 5, ease: 'easeOut' } }}
        className='marquee-landing'>

        <div className='marquee-background__landing'>
            <Marquee speed={20}>
                {imageNumbers.slice(0, 10).map(image => (
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
                {imageNumbers.slice(30, 40).map(image => (
                    <img key={image} src={`/assets/images/auth-bg/${image}.webp`} className='marquee-background__image' alt={``} />
                ))}
            </Marquee>
            <Marquee speed={20}>
                {imageNumbers.slice(0, 10).map(image => (
                    <img key={image} src={`/assets/images/auth-bg/${image}.webp`} className='marquee-background__image' alt={``} />
                ))}
            </Marquee>
        </div>
    </motion.div>
}

const Landing = () => {
    // const navigate = useNavigate()

        return (
            <>  
                <div className="flex flex-col items-center">
                    {/* FIRST PAGE */}
                    
                    <section className='relative h-screen flex flex-col justify-center items-center overflow-hidden'>
                        {/* <MarqueeImageSliderBackground /> */}

                        <div className='relative w-full mb-[20rem]'>
                            <div className='absolute w-full inset-0 bg-[#080808] opacity-80 z-20'></div>
                            <MarqueeImageSlider />
                        </div>
                       
                        <div className="fixed top-0 w-full z-50">
                            <Navbar />
                        </div>
    
                        <div className="absolute z-30 flex flex-col items-center mx-[28px] max-w-[600px] max-h-[100vh]">
                            <div className="text-[4.8rem] text-white font-bold leading-[5.6rem] lg:text-[4rem] lg:leading-[4.8rem] text-center px-[2rem]">
                                Swipe, Match, Love - Your Perfect Partner Awaits!
                            </div>
    
                            <div className='mt-6'>
                                <button className="w-full rounded-[0.8rem] cursor-pointer bg-[#F2243E] py-6 px-[15rem] lg:px-[20rem] text-white text-[1.8rem] font-medium leading-[2.16rem] active:scale-[0.98] disabled:hover:scale-100 disabled:opacity-70 transition-all duration-200 flex items-center justify-center">
                                    Download Now
                                </button>
                            </div>
                            {/* <div className='mt-6'>
                                <button onClick={() => navigate("/auth/login")} className="w-full rounded-[0.8rem] cursor-pointer bg-[#F2243E] py-6 px-[15rem] lg:px-[20rem] text-white text-[1.8rem] font-medium leading-[2.16rem] active:scale-[0.98] disabled:hover:scale-100 disabled:opacity-70 transition-all duration-200 flex items-center justify-center">
                                    Login
                                </button>
                            </div>
    
                            <div className="mt-4">
                                <p className="text-[1.6rem] text-white">Don't have an account? <a className="text-[1.6rem] font-bold underline cursor-pointer" onClick={() => navigate("/auth/create-account")}>Create Account</a></p>
                            </div> */}
                        </div>

                    </section>

                    <DesktopWebsiteFeatures />
                    
                    <div className='bottom-0 w-full z-20 pt-64'>
                    <Footer />
                    </div>
                </div>
            </>
        )
    }
    export default Landing;