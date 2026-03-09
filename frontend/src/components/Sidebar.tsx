'use client';

import { useAuth } from '../contexts/AuthContext';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Download, Upload, Boxes, Package, MapPin, PackageOpen, Users as UsersIcon } from 'lucide-react';

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/inbound', label: 'Inbound Entry', icon: Download },
    { href: '/outbound', label: 'Outbound Dispatch', icon: Upload },
    { href: '/inventory', label: 'Inventory Monitor', icon: Boxes },
    { href: '/master/products', label: 'Products', icon: Package },
    { href: '/master/locations', label: 'Locations', icon: MapPin },
    { href: '/master/users', label: 'Users', icon: UsersIcon },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();

    const visibleNavItems = navItems.filter(item => {
        // Only ADMIN can see users master data; Products and Locations are read-only for STAFF
        const isMasterMenu = item.href.startsWith('/master');
        const isAllowedForStaff = item.href === '/master/products' || item.href === '/master/locations';
        if (isMasterMenu && !isAllowedForStaff && user?.role !== 'ADMIN') {
            return false;
        }
        return true;
    });

    return (
        <aside className="w-64 border-r bg-background hidden md:flex flex-col z-20">
            <div className="h-16 px-6 border-b flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
                    <PackageOpen size={18} strokeWidth={2} />
                </div>
                <h1 className="text-lg font-bold text-foreground">
                    Smart WMS
                </h1>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {visibleNavItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <item.icon size={18} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
