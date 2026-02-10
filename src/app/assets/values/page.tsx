"use client";

import React from 'react';
import { AssetValueEditor } from '@/components/ai-studio/pages/AssetValueEditor';
import { useAssetContext } from '@/context/AssetContext';

export default function AssetValuesPage() {
    const { assets, handleUpdateAssetsBulk, handleUpdateAsset } = useAssetContext();

    return (
        <AssetValueEditor
            assets={assets}
            onUpdateAssets={handleUpdateAssetsBulk}
            onUpdateAsset={handleUpdateAsset}
        />
    );
}
