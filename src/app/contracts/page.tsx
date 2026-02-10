import { getContracts } from '@/app/actions/contracts';
import { getAssets } from '@/app/actions/assets';
import ContractsClient from './client';

export default async function ContractsPage() {
    const contracts = await getContracts();
    const assets = await getAssets();

    return <ContractsClient initialContracts={contracts} initialAssets={assets} />;
}
