"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AmortizationReport } from '@/components/ai-studio/pages/AmortizationReport';
import { useAssetContext } from '@/context/AssetContext';

export default function AmortizationResultPage() {
    const { simulationResult, handleNavigate, handleSaveReport } = useAssetContext();
    const router = useRouter();

    useEffect(() => {
        if (!simulationResult) {
            router.push('/simulations');
        }
    }, [simulationResult, router]);

    if (!simulationResult) return null;

    return (
        <AmortizationReport
            result={simulationResult}
            onBack={() => handleNavigate('saved_simulations')}
            onSave={handleSaveReport}
        />
    );
}
