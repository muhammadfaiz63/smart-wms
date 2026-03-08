'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { axiosClient } from '../../lib/axiosClient';
import { Boxes, AlertTriangle, Loader2, ArrowRightLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

interface Stock {
    sku: string;
    name: string;
    bin_code: string;
    batch_no: string;
    qty: number;
    expired_at: string | null;
    status: string;
}

export default function InventoryPage() {
    const [inventory, setInventory] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInv = async () => {
            try {
                const res = await axiosClient.get('/inventory');
                setInventory(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInv();
    }, []);

    const isNearExpired = (dateString: string | null) => {
        if (!dateString) return false;
        const expDate = new Date(dateString);
        const diffDays = Math.ceil((expDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
    };

    const isExpired = (dateString: string | null) => {
        if (!dateString) return false;
        return new Date(dateString).getTime() < new Date().getTime();
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory Monitor</h1>
                    <p className="text-muted-foreground mt-1">Real-time breakdown of physical stock.</p>
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Location (Bin)</TableHead>
                                <TableHead>Batch No</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead>Expiration</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        <Loader2 className="animate-spin inline mr-2 h-4 w-4" /> Loading inventory...
                                    </TableCell>
                                </TableRow>
                            ) : inventory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                        No physical stock found in the warehouse.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                inventory.map((item, idx) => {
                                    const expired = isExpired(item.expired_at);
                                    const nearExp = !expired && isNearExpired(item.expired_at);
                                    const pendingQuarantine = item.status === 'PENDING_QUARANTINE';

                                    return (
                                        <TableRow key={idx} className={`${expired || pendingQuarantine ? 'bg-destructive/5' : nearExp ? 'bg-amber-500/5' : ''}`}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono">{item.bin_code}</Badge>
                                            </TableCell>
                                            <TableCell>{item.batch_no}</TableCell>
                                            <TableCell>
                                                <Badge variant={pendingQuarantine || item.status === 'QUARANTINED' ? 'destructive' : 'secondary'}>
                                                    {item.status || 'AVAILABLE'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{item.qty.toLocaleString()}</TableCell>
                                            <TableCell>
                                                {item.expired_at ? (
                                                    <div className={`flex items-center gap-2 ${expired ? 'text-destructive font-medium' : nearExp ? 'text-amber-500 font-medium' : 'text-muted-foreground'}`}>
                                                        {(expired || nearExp) && <AlertTriangle size={14} />}
                                                        {new Date(item.expired_at).toLocaleDateString()}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" title="Transfer / Quarantine">
                                                    <ArrowRightLeft className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </DashboardLayout>
    );
}
