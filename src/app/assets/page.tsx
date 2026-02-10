"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AssetTable } from '@/components/ai-studio/pages/AssetTable';
import { useAssetContext } from '@/context/AssetContext';

function AssetsContent() {
    const { assets, setAssets, handleNavigate, handleUpdateAsset } = useAssetContext();
    const searchParams = useSearchParams();
    const view = searchParams.get('view') === 'grid' ? 'assets_grid' : 'assets_list';

    return (
        <AssetTable
            assets={assets}
            onUpdateAssets={setAssets}
            onSaveAsset={handleUpdateAsset}
            onNavigate={handleNavigate}
            viewMode={view}
            initialEditAssetId={searchParams.get('editId')}
        />
    );
}

export default function AssetsPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <AssetsContent />
        </Suspense>
    );
}
