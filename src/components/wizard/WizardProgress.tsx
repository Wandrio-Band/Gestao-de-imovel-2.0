import React from 'react';

interface WizardProgressProps {
    currentStep: number;
    totalSteps: number;
    stepTitles: string[];
}

export const WizardProgress: React.FC<WizardProgressProps> = ({ currentStep, totalSteps, stepTitles }) => {
    return (
        <div className="mb-8">
            {/* Progress Bars */}
            <div className="flex items-center gap-2 mb-4">
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                        key={i}
                        className={`flex-1 h-2 rounded-full transition-all duration-300 ${i < currentStep
                                ? 'bg-blue-500'
                                : i === currentStep
                                    ? 'bg-blue-300 animate-pulse'
                                    : 'bg-gray-200'
                            }`}
                    />
                ))}
            </div>

            {/* Step Title */}
            <div className="text-center">
                <p className="text-sm font-bold text-gray-900">
                    Passo {currentStep + 1} de {totalSteps}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    {stepTitles[currentStep]}
                </p>
            </div>
        </div>
    );
};
