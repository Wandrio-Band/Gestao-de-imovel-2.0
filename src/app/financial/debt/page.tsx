"use client";

import React from 'react';
import { DebtManagement } from '@/components/ai-studio/pages/DebtManagement';
import { useAssetContext } from '@/context/AssetContext';

export default function DebtManagementPage() {
    const { handleNavigate } = useAssetContext();

    return <DebtManagement onNavigate={handleNavigate} />;
}
