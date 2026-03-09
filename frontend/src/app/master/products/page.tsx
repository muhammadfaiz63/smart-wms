'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { axiosClient } from '../../../lib/axiosClient';
import { Package, Plus, Loader2, Edit, Trash2 } from 'lucide-react';
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
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);

    const [sku, setSku] = useState('');
    const [name, setName] = useState('');
    const [unit, setUnit] = useState('pcs');
    const [submitting, setSubmitting] = useState(false);

    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

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

    const handleEditClick = (product: Product) => {
        setEditId(product.id);
        setSku(product.sku);
        setName(product.name);
        setUnit(product.unit);
        setOpenEditDialog(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axiosClient.patch(`/master/products/${editId}`, { sku, name, unit });
            setOpenEditDialog(false);
            setEditId(null);
            setSku(''); setName(''); setUnit('pcs');
            await fetchProducts();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update product');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
        setOpenDeleteDialog(true);
    };

    const handleDelete = async () => {
        setSubmitting(true);
        try {
            await axiosClient.delete(`/master/products/${deleteId}`);
            setOpenDeleteDialog(false);
            setDeleteId(null);
            await fetchProducts();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete product. Ensure it is not used in active stock.');
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

                    {user?.role === 'ADMIN' && (
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
                    )}

                    <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Edit Product</DialogTitle>
                                <DialogDescription>
                                    Update the master data for this product.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleUpdate} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>SKU Code</Label>
                                    <Input type="text" required value={sku} onChange={e => setSku(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Product Name</Label>
                                    <Input type="text" required value={name} onChange={e => setName(e.target.value)} />
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
                                    <Button type="button" variant="outline" onClick={() => { setOpenEditDialog(false); setSku(''); setName(''); setUnit('pcs'); }}>Cancel</Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                        Update Product
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Delete Product</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete this product? This action cannot be undone and will fail if there is existing stock.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                                <Button type="button" variant="destructive" onClick={handleDelete} disabled={submitting}>
                                    {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                    Delete
                                </Button>
                            </div>
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
                                    {user?.role === 'ADMIN' && <TableHead className="text-right">Actions</TableHead>}
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
                                        {user?.role === 'ADMIN' && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(p)} title="Edit">
                                                        <Edit className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(p.id)} title="Delete">
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
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
