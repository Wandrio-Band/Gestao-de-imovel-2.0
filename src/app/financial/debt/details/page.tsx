"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DebtDetails } from '@/components/ai-studio/pages/DebtDetails';
import { useAssetContext } from '@/context/AssetContext';

export default function DebtDetailsPage() {
    const { selectedAsset, handleNavigate, handleSimulationComplete, handleUpdateAsset } = useAssetContext();
    const router = useRouter();

    useEffect(() => {
        if (!selectedAsset) {
            router.push('/financial/debt');
        }
    }, [selectedAsset, router]);

    if (!selectedAsset) return null;

    return (
        <DebtDetails
            asset={selectedAsset}
            onNavigate={handleNavigate}
            onSimulationComplete={handleSimulationComplete}
            onUpdateAsset={handleUpdateAsset}
        />
    );
}
