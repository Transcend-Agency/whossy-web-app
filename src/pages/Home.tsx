import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Home = () => {

    return (
        <div className='home'>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }} exit={{ opacity: 0, transition: { duration: 0.2 } }} className='home__container'>
                <h1 className='home__title'>
                    Heartfelt Connections Await. <br className='home__line-break'/>Discover Love on Whossy.
                </h1>
                <Link to="/auth/login" className="button-container"><button className='w-full rounded-[0.8rem] cursor-pointer bg-[#F2243E] py-6 text-white text-[1.8rem] font-medium leading-[2.16rem] active:scale-[0.98] disabled:hover:scale-100 disabled:opacity-70 transition-all duration-200 flex items-center justify-center'> Login </button></Link>
                <p className='home__cta'>Don't have an account? <Link to="/auth/create-account" className='home__cta__underline cursor-pointer'>Create account</Link></p>
            </motion.div>
        </div>
    )
}
export default Home;