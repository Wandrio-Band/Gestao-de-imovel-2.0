"use client";

import React from 'react';
import { Reports } from '@/components/ai-studio/pages/Reports';
import { useAssetContext } from '@/context/AssetContext';

export default function ReportsPage() {
    const { handleNavigate } = useAssetContext();

    return <Reports onNavigate={handleNavigate} />;
}
