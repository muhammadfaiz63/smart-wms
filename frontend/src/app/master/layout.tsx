'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && user) {
            if (user.role !== 'ADMIN') {
                // STAFF can only access products and locations
                if (!pathname.startsWith('/master/products') && !pathname.startsWith('/master/locations')) {
                    router.push('/');
                }
            }
        }
    }, [user, isLoading, router, pathname]);

    // We wait for loading to finish. We only show a loading screen or block if it's explicitly blocked above. 
    // The useEffect will handle the redirect. We can just return children or a loader.
    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-[80vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return <>{children}</>;
}
