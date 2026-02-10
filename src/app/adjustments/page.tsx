
import { getAssets } from '../actions/assets';
import { fetchIndexHistory } from '@/services/bcb';
import { AdjustmentDashboard } from '@/components/ai-studio/pages/AdjustmentDashboard';


export default async function AdjustmentsPage() {
    const assetsData = getAssets();
    const igpmData = fetchIndexHistory('IGPM', 24);
    const ipcaData = fetchIndexHistory('IPCA', 24); // Fetch enough buffer

    const [assets, igpm, ipca] = await Promise.all([assetsData, igpmData, ipcaData]);

    return (
        <AdjustmentDashboard
            assets={assets}
            igpmHistory={igpm}
            ipcaHistory={ipca}
        />
    );
}
