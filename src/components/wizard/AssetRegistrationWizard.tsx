import React, { useState } from 'react';
import { useAssetForm } from '@/hooks/useAssetForm';
import { ViewState, Asset, FinancingDetails, LeaseDetails } from '@/components/ai-studio/types';
import { WizardProgress } from './WizardProgress';
import { WizardNavigation } from './WizardNavigation';
import { Step1Identification } from './steps/Step1Identification';
import { Step2Documentation } from './steps/Step2Documentation';
import { Step3Financial } from './steps/Step3Financial';
import { Step4Partners } from './steps/Step4Partners';
import { FinancingModal } from '../ai-studio/pages/Forms/FinancingModal';
import { LeaseModal } from '../ai-studio/pages/Forms/LeaseModal';
import toast from 'react-hot-toast';

interface AssetRegistrationWizardProps {
    onNavigate: (view: ViewState, asset?: Asset) => void;
    asset?: Asset;
    isModal?: boolean;
    onClose?: () => void;
    onUpdateAsset?: (asset: Asset) => void;
}

export const AssetRegistrationWizard: React.FC<AssetRegistrationWizardProps> = ({
    onNavigate,
    asset,
    isModal,
    onClose,
    onUpdateAsset,
}) => {
    const { formState, helpers } = useAssetForm(asset);
    const [currentStep, setCurrentStep] = useState(0);
    const [showFinancingModal, setShowFinancingModal] = useState(false);
    const [showLeaseModal, setShowLeaseModal] = useState(false);

    const stepTitles = [
        'Identificação Básica',
        'Características & Documentação',
        'Valores Financeiros',
        'Sócios & Estrutura (Opcional)',
    ];

    // Validation per step
    const validateStep = (step: number): string | null => {
        switch (step) {
            case 0:
                if (!formState.name || formState.name.length < 3) return 'Nome do ativo deve ter pelo menos 3 caracteres';
                if (!formState.type) return 'Selecione o tipo do ativo';
                if (!formState.city || !formState.state) return 'Cidade e estado são obrigatórios';
                return null;
            case 1:
                if (formState.areaTotal && parseFloat(formState.areaTotal) < 0) return 'Área total inválida';
                return null;
            case 2:
                return null; // Financial fields are all optional
            case 3:
                const totalPercentage = formState.partners.reduce((sum, p) => sum + (p.percentage || 0), 0);
                if (formState.partners.length > 0 && totalPercentage !== 100) {
                    return `A soma dos percentuais dos sócios deve ser 100%. Atualmente está em ${totalPercentage}%`;
                }
                return null;
            default:
                return null;
        }
    };

    const handleNext = () => {
        const error = validateStep(currentStep);
        if (error) {
            toast.error(error);
            return;
        }

        if (currentStep === stepTitles.length - 1) {
            handleSave();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(0, prev - 1));
    };

    const handleCancel = () => {
        if (onClose) {
            onClose();
        } else {
            onNavigate('assets_list');
        }
    };

    const handleSave = () => {
        const formattedAsset = helpers.getFormattedAsset();

        if (onUpdateAsset) {
            onUpdateAsset(formattedAsset);
        }

        toast.success(asset ? 'Ativo atualizado com sucesso!' : 'Ativo cadastrado com sucesso!');

        if (onClose) {
            onClose();
        } else {
            onNavigate('assets_list');
        }
    };

    const handleFinancingSave = (data: FinancingDetails) => {
        formState.setFinancingData(data);
        setShowFinancingModal(false);
        toast.success('Financiamento configurado!');
    };

    const handleLeaseSave = (data: LeaseDetails) => {
        formState.setLeaseData(data);
        setShowLeaseModal(false);
        toast.success('Locação configurada!');
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <Step1Identification
                        name={formState.name}
                        setName={formState.setName}
                        type={formState.type}
                        setType={(v: string) => formState.setType(v)}
                        status={formState.status}
                        setStatus={(v: string) => formState.setStatus(v)}
                        street={formState.street}
                        setStreet={formState.setStreet}
                        number={formState.number}
                        setNumber={formState.setNumber}
                        complement={formState.complement}
                        setComplement={formState.setComplement}
                        neighborhood={formState.neighborhood}
                        setNeighborhood={formState.setNeighborhood}
                        city={formState.city}
                        setCity={formState.setCity}
                        state={formState.state}
                        setState={formState.setState}
                        zipCode={formState.zipCode}
                        setZipCode={formState.setZipCode}
                    />
                );
            case 1:
                return (
                    <Step2Documentation
                        areaTotal={formState.areaTotal}
                        setAreaTotal={formState.setAreaTotal}
                        matricula={formState.matricula}
                        setMatricula={formState.setMatricula}
                        iptu={formState.iptu}
                        setIptu={formState.setIptu}
                        cartorio={formState.registryOffice}
                        setCartorio={formState.setRegistryOffice}
                        acquisitionDate={formState.acquisitionDate}
                        setAcquisitionDate={formState.setAcquisitionDate}
                        irpfStatus={formState.irpfStatus || 'Declarado'}
                        setIrpfStatus={(v: string) => formState.setIrpfStatus(v)}
                        origin={formState.acquisitionOrigin}
                        setOrigin={formState.setAcquisitionOrigin}
                    />
                );
            case 2:
                return (
                    <Step3Financial
                        value={formState.acquisitionValue}
                        setValue={formState.setAcquisitionValue}
                        marketValue={formState.marketValue}
                        setMarketValue={formState.setMarketValue}
                        irpfValue={formState.declaredValue}
                        setIrpfValue={formState.setDeclaredValue}
                        saleExpectation={formState.saleForecast}
                        setSaleExpectation={formState.setSaleForecast}
                        suggestedRent={formState.rentalValue}
                        setSuggestedRent={formState.setRentalValue}
                    />
                );
            case 3:
                return (
                    <Step4Partners
                        partners={formState.partners}
                        setPartners={formState.setPartners}
                        hasFinancing={!!formState.financingData}
                        onConfigureFinancing={() => setShowFinancingModal(true)}
                        hasLease={!!formState.leaseData}
                        onConfigureLease={() => setShowLeaseModal(true)}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#f6f6f8] p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
                        {asset ? 'Editar Ativo' : 'Cadastrar Novo Ativo'}
                    </h1>
                    <p className="text-sm text-gray-600">
                        Preencha as informações do imóvel em etapas. Campos marcados com * são obrigatórios.
                    </p>
                </div>

                {/* Wizard Card */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-gray-100">
                    {/* Progress Indicator */}
                    <WizardProgress
                        currentStep={currentStep}
                        totalSteps={stepTitles.length}
                        stepTitles={stepTitles}
                    />

                    {/* Step Content */}
                    <div className="min-h-[400px]">
                        {renderStep()}
                    </div>

                    {/* Navigation */}
                    <WizardNavigation
                        currentStep={currentStep}
                        totalSteps={stepTitles.length}
                        onBack={handleBack}
                        onNext={handleNext}
                        onCancel={handleCancel}
                        isLastStep={currentStep === stepTitles.length - 1}
                        canProceed={true}
                    />
                </div>
            </div>

            {/* Modals */}
            {showFinancingModal && (
                <FinancingModal
                    isOpen={showFinancingModal}
                    onSave={handleFinancingSave}
                    onClose={() => setShowFinancingModal(false)}
                />
            )}

            {showLeaseModal && (
                <LeaseModal
                    isOpen={showLeaseModal}
                    onSave={handleLeaseSave}
                    onClose={() => setShowLeaseModal(false)}
                />
            )}
        </div>
    );
};
