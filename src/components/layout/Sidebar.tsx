import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { WOMBAT_TROPHY_URL } from '../../constants';

const Sidebar = () => {
    const {
        user,
        partner,
        problems,
        currentProblem,
        startNewProblem,
        setCurrentProblem,
        updateUserName,
        activeTab,
        setActiveTab,
    } = useAppContext();

    return (
        <div className="md:col-span-1">
            <div className="bg-gray-900 p-4 rounded-xl shadow-2xl border border-gray-700 space-y-4">
               <div>
                    <h3 className="font-bold text-lg text-white">Your Names</h3>
                    <div className="space-y-2 mt-2">
                        <input type="text" placeholder="Your Name" defaultValue={user?.name} onBlur={(e) => updateUserName(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white"/>
                        <input type="text" placeholder="Partner's Name" value={partner?.name || ''} disabled className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-gray-400"/>
                    </div>
               </div>
               <hr className="border-gray-700"/>
                <div>
                    <div className="flex border-b border-gray-700 mb-4">
                        <button onClick={() => setActiveTab('active')} className={`py-2 px-4 font-bold ${activeTab === 'active' ? 'text-lime-400 border-b-2 border-lime-400' : 'text-gray-400'}`}>Active Dramas</button>
                        <button onClick={() => setActiveTab('trophy')} className={`py-2 px-4 font-bold ${activeTab === 'trophy' ? 'text-lime-400 border-b-2 border-lime-400' : 'text-gray-400'}`}>Trophy Room</button>
                    </div>
                    <button onClick={startNewProblem} className="w-full bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold py-2 px-4 rounded-lg mb-4 transition">+ New Problem</button>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {problems.filter(p => activeTab === 'active' ? p.status !== 'resolved' : p.status === 'resolved').map(p => (
                            <div key={p.id} onClick={() => setCurrentProblem(p)} className={`p-4 rounded-lg cursor-pointer transition ${currentProblem?.id === p.id ? 'bg-lime-900/50 ring-2 ring-lime-400' : 'bg-gray-800 hover:bg-gray-700'}`}>
                                <p className="font-semibold truncate text-white">{p.problem_statement || `Problem from ${new Date(p.createdAt.seconds * 1000).toLocaleDateString()}`}</p>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${ p.status === 'resolved' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{p.status.replace(/_/g, ' ')}</span>
                            </div>
                        ))}
                        {activeTab === 'trophy' && problems.filter(p=>p.status === 'resolved').length === 0 &&
                            <div className="text-center p-8 text-gray-500">
                                <img src={WOMBAT_TROPHY_URL} className="w-32 h-32 mx-auto rounded-full opacity-30" />
                                <p className="mt-4 font-serif">The Trophy Room is depressingly empty.</p>
                                <p className="text-sm">Try solving a problem first.</p>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
