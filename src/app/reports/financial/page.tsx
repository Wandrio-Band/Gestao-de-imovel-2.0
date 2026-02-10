"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ReportFinancialExecutive } from '@/components/ai-studio/pages/ReportFinancialExecutive';
import { useAssetContext } from '@/context/AssetContext';

export default function ReportFinancialPage() {
    const { selectedAsset, handleNavigate } = useAssetContext();
    const router = useRouter();

    useEffect(() => {
        if (!selectedAsset) {
            router.push('/reports');
        }
    }, [selectedAsset, router]);

    if (!selectedAsset) return null;

    return (
        <ReportFinancialExecutive
            asset={selectedAsset}
            onNavigate={handleNavigate}
        />
    );
}
