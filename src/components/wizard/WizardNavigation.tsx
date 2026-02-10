import React from 'react';

interface WizardNavigationProps {
    currentStep: number;
    totalSteps: number;
    onBack: () => void;
    onNext: () => void;
    onCancel: () => void;
    isLastStep: boolean;
    canProceed?: boolean;
}

export const WizardNavigation: React.FC<WizardNavigationProps> = ({
    currentStep,
    totalSteps,
    onBack,
    onNext,
    onCancel,
    isLastStep,
    canProceed = true,
}) => {
    return (
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            {/* Cancel Button */}
            <button
                onClick={onCancel}
                className="px-6 py-3 rounded-full bg-white border border-gray-200 font-bold text-sm hover:bg-gray-50 text-gray-600 transition-colors"
            >
                Cancelar
            </button>

            <div className="flex-1" />

            {/* Back Button */}
            {currentStep > 0 && (
                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-sm text-gray-700 transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Voltar
                </button>
            )}

            {/* Next/Finish Button */}
            <button
                onClick={onNext}
                disabled={!canProceed}
                className={`px-6 py-3 rounded-full font-bold text-sm shadow-lg transition-colors flex items-center gap-2 ${canProceed
                        ? 'bg-[#1152d4] hover:bg-blue-700 text-white shadow-blue-200'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
            >
                {isLastStep ? (
                    <>
                        <span className="material-symbols-outlined text-lg">save</span>
                        Finalizar Cadastro
                    </>
                ) : (
                    <>
                        Próximo
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </>
                )}
            </button>
        </div>
    );
};
