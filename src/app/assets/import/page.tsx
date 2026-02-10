"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useAssetContext } from '@/context/AssetContext';

const ImportIRPF = dynamic(
    () => import('@/components/ai-studio/pages/ImportIRPF'),
    { ssr: false }
);

export default function ImportIRPFPage() {
    const { assets, handleNavigate, handleUpdateAssetsBulk } = useAssetContext();

    return (
        <ImportIRPF
            onNavigate={handleNavigate}
            onUpdateAssets={handleUpdateAssetsBulk}
            currentAssets={assets}
        />
    );
}
