import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

type HomeProps = {

};

const Home: React.FC<HomeProps> = () => {

    return (
        <div className='home'>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.25, delay: 1 } }} exit={{ opacity: 0, transition: { duration: 0.25 } }} className='home__container'>
                <h1 className='home__title'>
                    Heartfelt Connections Await. <br />Discover Love on Whossy.
                </h1>
                <Link to="/auth/login" className="button-container"><Button text='Login' /></Link>
                <p className='home__cta'>Don't have an account? <Link to="/auth/create-account" className='home__cta__underline'>Create account</Link></p>
            </motion.div>
        </div>
    )
}
export default Home;