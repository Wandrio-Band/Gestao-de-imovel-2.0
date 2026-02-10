"use client";

import React from 'react';
import { AssetRegistration } from '@/components/ai-studio/pages/Forms/AssetRegistration';
import { useAssetContext } from '@/context/AssetContext';

export default function NewAssetPage() {
    const { selectedAsset, handleNavigate, handleUpdateAsset } = useAssetContext();

    return (
        <AssetRegistration
            asset={selectedAsset || undefined}
            onNavigate={handleNavigate}
            onUpdateAsset={handleUpdateAsset}
        />
    );
}
