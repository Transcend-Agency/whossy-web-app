import { useState } from 'react';
import { motion } from 'framer-motion'

const ShortcutControls = () => {
    const [shortcutControlsShowing, setShortcutControlsShowing] = useState(true)
    const toggleShortcutControlsShowing = () => {
        setShortcutControlsShowing(!shortcutControlsShowing)
    }
    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='dashboard-layout__shortcut-controls'>
        <button onClick={toggleShortcutControlsShowing} data-cy="control-button" className="control-button">{shortcutControlsShowing ? 'Hide' : 'Show'}</button>
        <motion.div initial={{ opacity: shortcutControlsShowing ? 1 : 0 }} animate={{ opacity: shortcutControlsShowing ? 1 : 0 }} className='shortcut-container'>
            <div className='shortcut'>
                <img src="/assets/icons/shortcuts/left-arrow.svg" className='shortcut__key'  alt={``}/>
                Nope
            </div>
            <div className='shortcut'>
                <img src="/assets/icons/shortcuts/right-arrow.svg" className='shortcut__key' />
                Like
            </div>
            <div className='shortcut'>
                <img src="/assets/icons/shortcuts/up-arrow.svg" className='shortcut__key' />
                Open Profile
            </div>
            <div className='shortcut'>
                <img src="/assets/icons/shortcuts/down-arrow.svg" className='shortcut__key' />
                Close Profile
            </div>
            {/*<div className='shortcut'>*/}
            {/*    <img src="/assets/icons/shortcuts/redo.svg" className='shortcut__key' />*/}
            {/*    Redo*/}
            {/*</div>*/}
            <div className='shortcut'>
                <img src="/assets/icons/shortcuts/spacebar.svg" className='shortcut__key' />
                Next Photo
            </div>
        </motion.div>
    </motion.div>
}
export default ShortcutControls;