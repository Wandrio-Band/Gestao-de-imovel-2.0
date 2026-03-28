import React from 'react';

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-5xl text-gray-400" aria-hidden="true">{icon}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 text-center max-w-md mb-6">{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-3 rounded-full bg-[#1152d4] hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-200 transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">add</span>
                    {action.label}
                </button>
            )}
        </div>
    );
};
