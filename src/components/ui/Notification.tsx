import React, { useEffect } from 'react';
import { WOMBAT_THINKING_URL } from '../../constants';

/**
 * A component to display temporary notifications.
 * @param {{notification: object, onDismiss: function}} props - Notification object and dismiss handler.
 * @returns {JSX.Element|null}
 */
const Notification = ({ notification, onDismiss }) => {
    useEffect(() => {
        if (notification.show) {
            const timer = setTimeout(() => {
                onDismiss();
            }, notification.duration || 4000);
            return () => clearTimeout(timer);
        }
    }, [notification, onDismiss]);

    if (!notification.show) return null;

    const baseStyle = "fixed top-24 right-5 p-4 rounded-lg shadow-2xl text-white z-50 flex items-center max-w-sm border border-white/20 bg-gray-800/80 backdrop-blur-sm";

    return (
        <div className={baseStyle} onClick={onDismiss}>
            <img src={WOMBAT_THINKING_URL} alt="Wombat" className="w-12 h-12 rounded-full mr-4 border-2 border-white/50"/>
            <p className="text-sm font-semibold">{notification.message}</p>
        </div>
    );
};

export default Notification;
