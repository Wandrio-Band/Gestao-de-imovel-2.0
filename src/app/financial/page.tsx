"use client";

import React from 'react';
import { FinancialAssetList } from '@/components/ai-studio/pages/FinancialAssetList';
import { useAssetContext } from '@/context/AssetContext';

export default function FinancialOverviewPage() {
    const { handleNavigate } = useAssetContext();

    return (
        <FinancialAssetList onNavigate={handleNavigate} />
    );
}
