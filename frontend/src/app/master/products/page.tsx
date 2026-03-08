'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { axiosClient } from '../../../lib/axiosClient';
import { Package, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';

interface Product {
    id: number;
    sku: string;
    name: string;
    unit: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);

    // Form states
    const [sku, setSku] = useState('');
    const [name, setName] = useState('');
    const [unit, setUnit] = useState('pcs');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axiosClient.get('/master/products');
            setProducts(res.data);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axiosClient.post('/master/products', { sku, name, unit });
            setSku(''); setName(''); setUnit('pcs');
            setOpenDialog(false);
            await fetchProducts();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to create product');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Package size={24} />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">Products Registry</h1>
                        </div>
                        <p className="text-muted-foreground">Manage all item SKUs and product variations in the system.</p>
                    </div>

                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                        <DialogTrigger render={<Button />}>
                            <Plus className="mr-2 h-4 w-4" /> Add Product
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Register New SKU</DialogTitle>
                                <DialogDescription>
                                    Add a new product variation to the master data.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>SKU Code</Label>
                                    <Input type="text" required value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. PRD-89-AB" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Product Name</Label>
                                    <Input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Aluminium Foil 50m" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Packaging Unit</Label>
                                    <Select value={unit} onValueChange={v => setUnit(v || '')} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select unit..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                                            <SelectItem value="box">Boxes (box)</SelectItem>
                                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                            <SelectItem value="roll">Rolls (roll)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="pt-2 flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                        Save Product
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead className="text-right">System ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="animate-spin inline mr-2 h-4 w-4" /> Loading...</TableCell></TableRow>
                                ) : products.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No products found.</TableCell></TableRow>
                                ) : products.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-mono text-primary">{p.sku}</TableCell>
                                        <TableCell className="font-medium">{p.name}</TableCell>
                                        <TableCell>
                                            <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs uppercase tracking-wider">{p.unit}</span>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">#{p.id}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
