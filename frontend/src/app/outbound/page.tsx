'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { axiosClient } from '../../lib/axiosClient';
import { Upload, Loader2, CheckCircle2, AlertCircle, PackageSearch } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

interface Product { id: number; sku: string; name: string; }

export default function OutboundPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingConfig, setLoadingConfig] = useState(true);

    const [formData, setFormData] = useState({
        productId: '',
        qty: ''
    });

    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<{ picked_bin: string; picked_batch: string; message: string } | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axiosClient.get('/master/products');
                setProducts(res.data);
            } catch (err) {
                console.error('Failed to load products');
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchProducts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuggestion(null);
        setError('');

        try {
            const res = await axiosClient.post('/outbound', {
                productId: Number(formData.productId),
                qty: Number(formData.qty)
            });
            setSuggestion({
                picked_bin: res.data.picked_bin,
                picked_batch: res.data.picked_batch,
                message: res.data.suggestion || 'Pick complete.'
            });
            setFormData({ productId: '', qty: '' });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to process outbound. Check stock availability.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto flex flex-col gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Upload size={24} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Outbound Auto-Dispatch (FEFO)</h1>
                    </div>
                    <p className="text-muted-foreground">Request stock extraction and let the system guide you to the earliest expiration batch and location.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Dispatch Request Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Dispatch Request</CardTitle>
                            <CardDescription>Select product and requested valid quantity.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <Alert variant="destructive" className="mb-6">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Insufficient Stock or Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Target Product SKUs</Label>
                                    <Select value={formData.productId} onValueChange={v => setFormData({ ...formData, productId: v || '' })} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a product to dispatch..." />
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
                                    <Label>Required Quantity</Label>
                                    <Input
                                        type="number" min="1" required
                                        value={formData.qty}
                                        onChange={e => setFormData({ ...formData, qty: e.target.value })}
                                        placeholder="e.g. 50"
                                    />
                                </div>

                                <div className="pt-2">
                                    <Button type="submit" disabled={loading || loadingConfig} className="w-full">
                                        {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                        Calculate FEFO Pick
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* System Suggestion Result */}
                    <Card className={`${suggestion ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}>
                        <CardHeader>
                            <CardTitle>System Pick Instruction</CardTitle>
                            <CardDescription>Warehouse worker guidance generated by the WMS Engine.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!suggestion ? (
                                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                    <PackageSearch size={40} className="mb-4 opacity-50" />
                                    <p>Awaiting dispatch request...</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <Alert className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 [&>svg]:text-emerald-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <AlertTitle>Pick Instructions Ready</AlertTitle>
                                        <AlertDescription className="leading-relaxed">{suggestion.message}</AlertDescription>
                                    </Alert>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-background rounded-lg border">
                                            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Target Bin</p>
                                            <p className="text-xl font-bold">{suggestion.picked_bin || 'SPLIT'}</p>
                                        </div>
                                        <div className="p-4 bg-background rounded-lg border">
                                            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Target Batch</p>
                                            <p className="text-xl font-bold">{suggestion.picked_batch || 'SPLIT'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
