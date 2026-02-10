import React from 'react';

interface LoadingSkeletonProps {
    count?: number;
    variant?: 'card' | 'table' | 'list';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ count = 3, variant = 'card' }) => {
    const skeletons = Array.from({ length: count });

    if (variant === 'card') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {skeletons.map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 rounded-[2rem] h-48 mb-4" />
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'table') {
        return (
            <div className="space-y-4">
                {skeletons.map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-4 p-4 bg-white rounded-xl border border-gray-200">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/3" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-24" />
                    </div>
                ))}
            </div>
        );
    }

    // list variant
    return (
        <div className="space-y-3">
            {skeletons.map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-200 rounded-xl" />
            ))}
        </div>
    );
};
