'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { axiosClient } from '../../../lib/axiosClient';
import { MapPin, Plus, Loader2, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';

interface Location {
    id: number;
    bin_code: string;
    zone: string;
}

export default function LocationsPage() {
    const { user } = useAuth();
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);

    const [binCode, setBinCode] = useState('');
    const [zone, setZone] = useState('STOCK');
    const [submitting, setSubmitting] = useState(false);

    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const res = await axiosClient.get('/master/locations');
            setLocations(res.data);
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
            await axiosClient.post('/master/locations', { bin_code: binCode, zone });
            setBinCode(''); setZone('STOCK');
            setOpenDialog(false);
            await fetchLocations();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to create location');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (location: Location) => {
        setEditId(location.id);
        setBinCode(location.bin_code);
        setZone(location.zone);
        setOpenEditDialog(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axiosClient.patch(`/master/locations/${editId}`, { bin_code: binCode, zone });
            setOpenEditDialog(false);
            setEditId(null);
            setBinCode(''); setZone('STOCK');
            await fetchLocations();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update location');
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
            await axiosClient.delete(`/master/locations/${deleteId}`);
            setOpenDeleteDialog(false);
            setDeleteId(null);
            await fetchLocations();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete location. Ensure it is not assigned to any stock.');
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
                                <MapPin size={24} />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">Facilities Map</h1>
                        </div>
                        <p className="text-muted-foreground">Manage physical warehouse bin assignments and zone logic.</p>
                    </div>

                    {user?.role === 'ADMIN' && (
                        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                            <DialogTrigger render={<Button />}>
                                <Plus className="mr-2 h-4 w-4" /> Add Bin Location
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Create New Bin</DialogTitle>
                                    <DialogDescription>
                                        Assign a new physical space in the warehouse.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreate} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label>Bin Code</Label>
                                        <Input type="text" required value={binCode} onChange={e => setBinCode(e.target.value)} placeholder="e.g. A-01" className="font-mono uppercase" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Warehouse Zone</Label>
                                        <Select value={zone} onValueChange={v => setZone(v || '')} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select zone..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="STOCK">STOCK (Regular Storage)</SelectItem>
                                                <SelectItem value="PICKING">PICKING (Fast Moving)</SelectItem>
                                                <SelectItem value="QUARANTINE">QUARANTINE (Defective/Expired)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="pt-2 flex justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
                                        <Button type="submit" disabled={submitting}>
                                            {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                            Save Bin
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}

                    <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Edit Bin Location</DialogTitle>
                                <DialogDescription>
                                    Update the details of this warehouse bin.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleUpdate} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Bin Code</Label>
                                    <Input type="text" required value={binCode} onChange={e => setBinCode(e.target.value)} className="font-mono uppercase" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Warehouse Zone</Label>
                                    <Select value={zone} onValueChange={v => setZone(v || '')} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select zone..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="STOCK">STOCK (Regular Storage)</SelectItem>
                                            <SelectItem value="PICKING">PICKING (Fast Moving)</SelectItem>
                                            <SelectItem value="QUARANTINE">QUARANTINE (Defective/Expired)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="pt-2 flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => { setOpenEditDialog(false); setBinCode(''); setZone('STOCK'); }}>Cancel</Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                        Update Bin
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Delete Bin Location</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete this bin? This action cannot be undone and will fail if there is existing stock in it.
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
                                    <TableHead>Location ID (Bin)</TableHead>
                                    <TableHead>Assigned Zone</TableHead>
                                    {user?.role === 'ADMIN' && <TableHead className="text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="animate-spin inline mr-2 h-4 w-4" /> Loading...</TableCell></TableRow>
                                ) : locations.length === 0 ? (
                                    <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No locations found.</TableCell></TableRow>
                                ) : locations.map(l => (
                                    <TableRow key={l.id}>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono">{l.bin_code}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={l.zone === 'QUARANTINE' ? 'destructive' : l.zone === 'PICKING' ? 'default' : 'secondary'}>
                                                {l.zone}
                                            </Badge>
                                        </TableCell>
                                        {user?.role === 'ADMIN' && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(l)} title="Edit">
                                                        <Edit className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(l.id)} title="Delete">
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
