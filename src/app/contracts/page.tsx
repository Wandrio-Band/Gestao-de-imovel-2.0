import { getContracts } from '@/app/actions/contracts';
import { getAssets } from '@/app/actions/assets';
import ContractsClient from './client';

export default async function ContractsPage() {
    const result = await getContracts();
    const assets = await getAssets();

    return <ContractsClient initialResult={result} initialAssets={assets} />;
}
