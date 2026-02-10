'use client';

import React from 'react';
import { AuditLogViewer } from '@/components/ai-studio/pages/AuditLogViewer';

export default function SystemAuditPage() {
    return (
        <div className="h-full bg-gray-50/50">
            <AuditLogViewer onNavigate={() => { }} />
        </div>
    );
}
