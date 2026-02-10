"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/ai-studio/components/Sidebar';
import { ViewState } from '@/components/ai-studio/types';

export default function SidebarWrapper() {
    const router = useRouter();
    const pathname = usePathname();

    // Map current route to ViewState
    const getCurrentView = (): ViewState => {
        if (pathname === '/dashboard') return 'dashboard';
        if (pathname.startsWith('/assets')) return 'assets_list';
        if (pathname.startsWith('/financial')) return 'financial_overview';
        if (pathname.startsWith('/partners')) return 'partners';
        if (pathname.startsWith('/reports')) return 'report_executive';
        if (pathname.startsWith('/tenants')) return 'tenants';
        if (pathname.startsWith('/contracts')) return 'contracts';
        if (pathname.startsWith('/conciliacao')) return 'conciliation';
        if (pathname.startsWith('/adjustments')) return 'adjustments';
        if (pathname.startsWith('/invoices')) return 'invoices';
        if (pathname.startsWith('/system-audit')) return 'audit';
        if (pathname.startsWith('/ai-assistant')) return 'ai_assistant';
        return 'dashboard';
    };

    const currentView = getCurrentView();

    const handleNavigate = (view: ViewState) => {
        // Map ViewState to routes
        switch (view) {
            case 'dashboard':
                router.push('/dashboard');
                break;
            case 'assets_list':
            case 'assets_grid':
                router.push('/assets');
                break;
            case 'asset_values':
                router.push('/assets/values');
                break;
            case 'asset_new':
                router.push('/assets/new');
                break;
            case 'financial_overview':
                router.push('/financial');
                break;
            case 'financial_schedule':
                router.push('/financial/schedule');
                break;
            case 'debt_management':
                router.push('/financial/debt');
                break;
            case 'audit':
                router.push('/system-audit');
                break;
            case 'partners':
                router.push('/partners');
                break;
            case 'tenants':
                router.push('/tenants');
                break;
            case 'contracts':
                router.push('/contracts');
                break;
            case 'report_executive':
            case 'report_config':
                router.push('/reports');
                break;
            case 'ai_assistant':
                router.push('/ai-assistant');
                break;
            case 'import_irpf':
                router.push('/assets/import');
                break;
            case 'adjustments':
                router.push('/adjustments');
                break;
            case 'invoices':
                router.push('/invoices');
                break;
            case 'conciliation':
                router.push('/conciliacao');
                break;
            default:
                router.push('/dashboard');
        }
    };

    return (
        <Sidebar currentView={currentView} onNavigate={handleNavigate} />
    );
}
