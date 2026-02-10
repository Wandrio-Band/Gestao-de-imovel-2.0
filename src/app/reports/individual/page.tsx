"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ReportIndividual } from '@/components/ai-studio/pages/ReportIndividual';
import { useAssetContext } from '@/context/AssetContext';

export default function ReportIndividualPage() {
    const { selectedAsset, handleNavigate } = useAssetContext();
    const router = useRouter();

    useEffect(() => {
        if (!selectedAsset) {
            router.push('/reports');
        }
    }, [selectedAsset, router]);

    if (!selectedAsset) return null;

    return (
        <ReportIndividual
            asset={selectedAsset}
            onNavigate={handleNavigate}
        />
    );
}
