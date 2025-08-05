import React from 'react';
import { WOMBAT_AVATAR_URL } from '../../constants';

/**
 * Displays the Skeptical Wombat's avatar.
 * @param {{className?: string, src?: string}} props - Component props.
 * @returns {JSX.Element}
 */
const WombatAvatar = ({ className = "w-24 h-24 md:w-32 md:h-32", src = WOMBAT_AVATAR_URL }) => (
    <img
        src={src}
        alt="The Skeptical Wombat"
        className={`${className} rounded-full border-4 border-lime-400 shadow-lg object-cover`}
        onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/128x128/1F2937/A3E635?text=Wombat'; }}
    />
);

export default WombatAvatar;
