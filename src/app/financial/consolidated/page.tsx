"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConsolidatedStatement } from '@/components/ai-studio/pages/ConsolidatedStatement';
import { useAssetContext } from '@/context/AssetContext';

export default function ConsolidatedStatementPage() {
    const { selectedAsset, handleNavigate } = useAssetContext();
    const router = useRouter();

    useEffect(() => {
        if (!selectedAsset) {
            router.push('/financial');
        }
    }, [selectedAsset, router]);

    if (!selectedAsset) return null;

    return (
        <ConsolidatedStatement
            asset={selectedAsset}
            onNavigate={handleNavigate}
        />
    );
}
