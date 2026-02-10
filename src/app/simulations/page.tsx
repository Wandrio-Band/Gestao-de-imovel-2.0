"use client";

import React from 'react';
import { SavedSimulations } from '@/components/ai-studio/pages/SavedSimulations';
import { useAssetContext } from '@/context/AssetContext';

export default function SavedSimulationsPage() {
    const { savedReports, handleViewSavedReport, handleDeleteReport, handleNavigate } = useAssetContext();

    return (
        <SavedSimulations
            reports={savedReports}
            onViewReport={handleViewSavedReport}
            onDeleteReport={handleDeleteReport}
            onNavigate={handleNavigate}
        />
    );
}
