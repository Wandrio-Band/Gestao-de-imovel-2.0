"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FinancingDashboard } from '@/components/ai-studio/pages/Forms/FinancingDashboard';
import { useAssetContext } from '@/context/AssetContext';

export default function FinancingDetailsPage() {
    const { selectedAsset, handleNavigate, handleUpdateAsset } = useAssetContext();
    const router = useRouter();

    useEffect(() => {
        if (!selectedAsset) {
            router.push('/financial');
        }
    }, [selectedAsset, router]);

    if (!selectedAsset) return null;

    return (
        <FinancingDashboard
            asset={selectedAsset}
            onNavigate={handleNavigate}
            onUpdateAsset={handleUpdateAsset}
        />
    );
}
