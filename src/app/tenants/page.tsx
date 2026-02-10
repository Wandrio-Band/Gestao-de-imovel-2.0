import { getTenants } from '@/app/actions/tenants';
import TenantsClient from './client';

export default async function TenantsPage() {
    const tenants = await getTenants();

    return <TenantsClient initialTenants={tenants} />;
}
