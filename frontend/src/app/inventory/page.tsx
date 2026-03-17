'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '../../components/DashboardLayout';
import { axiosClient } from '../../lib/axiosClient';
import { AlertTriangle, Loader2, ArrowRightLeft, X } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

interface Stock {
    id: number;
    product: { id: number; sku: string; name: string };
    productId: number;
    location: { id: number; bin_code: string; zone: string };
    locationId: number;
    batch_no: string;
    qty: number;
    expired_at: string | null;
    status: string;
}

interface Location {
    id: number;
    bin_code: string;
    zone: string;
}

function InventoryContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialSearch = searchParams.get('search') || '';

    const [inventory, setInventory] = useState<Stock[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterQuery, setFilterQuery] = useState(initialSearch);

    const [openTransferDialog, setOpenTransferDialog] = useState(false);
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [toLocationId, setToLocationId] = useState<string>('');
    const [transferQty, setTransferQty] = useState<number>(0);
    const [submitting, setSubmitting] = useState(false);

    // Sync state if URL changes (e.g., from global search)
    useEffect(() => {
        setFilterQuery(searchParams.get('search') || '');
    }, [searchParams]);

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

        const fetchLocs = async () => {
            try {
                const res = await axiosClient.get('/master/locations');
                setLocations(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchInv();
        fetchLocs();
    }, []);

    const handleTransferClick = (stock: Stock) => {
        setSelectedStock(stock);
        setTransferQty(stock.qty);
        setToLocationId('');
        setOpenTransferDialog(true);
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStock || !toLocationId || transferQty <= 0) return;

        setSubmitting(true);
        try {
            await axiosClient.post('/inventory/transfer', {
                productId: selectedStock.productId,
                fromLocationId: selectedStock.locationId,
                toLocationId: parseInt(toLocationId),
                batchNo: selectedStock.batch_no,
                qty: transferQty,
            });
            setOpenTransferDialog(false);
            // Refresh inventory
            const res = await axiosClient.get('/inventory');
            setInventory(res.data);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to transfer stock');
        } finally {
            setSubmitting(false);
        }
    };

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

    const filteredInventory = inventory.filter(item => {
        if (!filterQuery) return true;
        const q = filterQuery.toLowerCase();
        return item.batch_no.toLowerCase().includes(q) ||
            item.product.name.toLowerCase().includes(q) ||
            item.product.sku.toLowerCase().includes(q);
    });

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Inventory Monitor</h1>
                        <p className="text-muted-foreground mt-1">Real-time breakdown of physical stock.</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Input
                            type="text"
                            placeholder="Filter batches..."
                            value={filterQuery}
                            onChange={(e) => {
                                setFilterQuery(e.target.value);
                                // Optional: Update URL without reloading to keep it cleanly in sync
                                // router.replace(`/inventory${e.target.value ? `?search=${e.target.value}` : ''}`, { scroll: false });
                            }}
                            className="pr-8"
                        />
                        {filterQuery && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1 h-7 w-7 text-muted-foreground"
                                onClick={() => setFilterQuery('')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
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
                            ) : filteredInventory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                        No physical stock found matching your filter.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInventory.map((item, idx) => {
                                    const expired = isExpired(item.expired_at);
                                    const nearExp = !expired && isNearExpired(item.expired_at);
                                    const pendingQuarantine = item.status === 'PENDING_QUARANTINE';

                                    return (
                                        <TableRow key={idx} className={`${expired || pendingQuarantine ? 'bg-destructive/5' : nearExp ? 'bg-amber-500/5' : ''}`}>
                                            <TableCell className="font-medium">{item.product.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{item.product.sku}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono">{item.location.bin_code}</Badge>
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
                                                <Button variant="ghost" size="icon" title="Transfer / Quarantine" onClick={() => handleTransferClick(item)}>
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

                <Dialog open={openTransferDialog} onOpenChange={setOpenTransferDialog}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Stock Transfer / Quarantine</DialogTitle>
                            <DialogDescription>
                                Move stock from <b>{selectedStock?.location.bin_code}</b> to another location.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleTransfer} className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Item</Label>
                                    <div className="text-sm font-medium truncate">{selectedStock?.product.name}</div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Batch</Label>
                                    <div className="text-sm font-mono">{selectedStock?.batch_no}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Destination Bin</Label>
                                <Select value={toLocationId} onValueChange={(v) => setToLocationId(v || '')} required>
                                    <SelectTrigger>
                                        {toLocationId ? (
                                            <span className="flex flex-1 text-left text-foreground truncate block">
                                                {locations.find(l => l.id.toString() === toLocationId)
                                                    ? `${locations.find(l => l.id.toString() === toLocationId)?.bin_code} (${locations.find(l => l.id.toString() === toLocationId)?.zone})`
                                                    : "Select destination bin..."}
                                            </span>
                                        ) : (
                                            <span className="flex flex-1 text-left text-muted-foreground truncate block">Select destination bin...</span>
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations
                                            .filter(l => l.id !== selectedStock?.locationId)
                                            .map(loc => (
                                                <SelectItem key={loc.id} value={loc.id.toString()}>
                                                    {loc.bin_code} ({loc.zone})
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Quantity to Move (Max: {selectedStock?.qty})</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={selectedStock?.qty}
                                    value={transferQty}
                                    onChange={e => setTransferQty(parseInt(e.target.value) || 0)}
                                    required
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setOpenTransferDialog(false)}>Cancel</Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                    Confirm Transfer
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}

export default function InventoryPage() {
    return (
        <Suspense fallback={<DashboardLayout><div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div></DashboardLayout>}>
            <InventoryContent />
        </Suspense>
    );
}
