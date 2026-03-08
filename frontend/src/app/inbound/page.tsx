'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { axiosClient } from '../../lib/axiosClient';
import { Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

interface Product { id: number; sku: string; name: string; }
interface Location { id: number; bin_code: string; zone: string; }

export default function InboundPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loadingConfig, setLoadingConfig] = useState(true);

    const [formData, setFormData] = useState({
        productId: '',
        locationId: '',
        qty: '',
        batchNo: '',
        expiredAt: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, locRes] = await Promise.all([
                    axiosClient.get('/master/products'),
                    axiosClient.get('/master/locations')
                ]);
                setProducts(prodRes.data);
                setLocations(locRes.data);
            } catch (err) {
                console.error('Failed to load metadata');
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            await axiosClient.post('/inbound', {
                productId: Number(formData.productId),
                locationId: Number(formData.locationId),
                qty: Number(formData.qty),
                batchNo: formData.batchNo,
                expiredAt: formData.expiredAt ? new Date(formData.expiredAt).toISOString() : null
            });
            setMessage('Stock successfully received and recorded!');
            setFormData({ productId: '', locationId: '', qty: '', batchNo: '', expiredAt: '' });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to process inbound transaction.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto flex flex-col gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Download size={24} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Inbound Entry</h1>
                    </div>
                    <p className="text-muted-foreground">Record incoming physical stock to a specific bin location.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Inbound Form</CardTitle>
                        <CardDescription>Fill in the details for the received stock items.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {message && (
                            <Alert className="mb-6 bg-emerald-500/15 text-emerald-600 border-emerald-500/20 [&>svg]:text-emerald-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertTitle>Success</AlertTitle>
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>
                        )}
                        {error && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Product SKU</Label>
                                    <Select value={formData.productId} onValueChange={v => setFormData({ ...formData, productId: v || '' })} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a product..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map(p => (
                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                    [{p.sku}] {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Destination Bin</Label>
                                    <Select value={formData.locationId} onValueChange={v => setFormData({ ...formData, locationId: v || '' })} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select destination bin..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map(l => (
                                                <SelectItem key={l.id} value={l.id.toString()}>
                                                    {l.bin_code} ({l.zone})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Quantity</Label>
                                    <Input
                                        type="number" min="1" required
                                        value={formData.qty}
                                        onChange={e => setFormData({ ...formData, qty: e.target.value })}
                                        placeholder="e.g. 100"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Batch Number</Label>
                                    <Input
                                        type="text" required
                                        value={formData.batchNo}
                                        onChange={e => setFormData({ ...formData, batchNo: e.target.value })}
                                        placeholder="e.g. BATCH-2026-A"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label>Expiration Date (Optional)</Label>
                                    <Input
                                        type="date"
                                        value={formData.expiredAt}
                                        onChange={e => setFormData({ ...formData, expiredAt: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button type="submit" disabled={loading || loadingConfig} className="w-full">
                                    {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                    Process Inbound
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
