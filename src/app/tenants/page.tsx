import { getTenants } from '@/app/actions/tenants';
import TenantsClient from './client';

export default async function TenantsPage() {
    const result = await getTenants();

    return <TenantsClient initialResult={result} />;
}
