'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { axiosClient } from '../../../lib/axiosClient';
import { MapPin, Plus, Loader2 } from 'lucide-react';
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
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);

    // Form states
    const [binCode, setBinCode] = useState('');
    const [zone, setZone] = useState('STOCK');
    const [submitting, setSubmitting] = useState(false);

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
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Location ID (Bin)</TableHead>
                                    <TableHead>Assigned Zone</TableHead>
                                    <TableHead className="text-right">System ID</TableHead>
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
                                        <TableCell className="text-right text-muted-foreground">#{l.id}</TableCell>
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
