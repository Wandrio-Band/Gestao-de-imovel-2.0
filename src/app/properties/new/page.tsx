'use client';

import { AssetRegistrationWizard } from '@/components/wizard/AssetRegistrationWizard';
import { useRouter } from 'next/navigation';
import { useAssetContext } from '@/context/AssetContext';

export default function NewAssetPage() {
    const router = useRouter();
    const { handleUpdateAsset } = useAssetContext();

    const handleNavigate = (view: string) => {
        router.push('/properties');
    };

    return (
        <AssetRegistrationWizard
            onNavigate={handleNavigate}
            onUpdateAsset={handleUpdateAsset}
        />
    );
}
