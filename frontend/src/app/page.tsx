'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { axiosClient } from '../lib/axiosClient';
import { LayoutDashboard, Package, Boxes, Download, Upload, AlertTriangle, Loader2, ArrowUpRight, BarChart3, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

interface SummaryData {
  total_products: number;
  total_stock: number;
  inbound_today: number;
  outbound_today: number;
  near_expired_count: number;
  quarantined_items: number;
  expired_items: number;
  throughput: { name: string; value: number }[];
}

const COLORS = ['#0f172a', '#ef4444', '#f59e0b'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axiosClient.get('/reports/summary');
        setSummary(res.data);
      } catch (err: any) {
        setError('Failed to fetch dashboard summary');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      const response = await axiosClient.get('/reports/export/excel', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const fileName = `Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', fileName);

      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err: any) {
      alert('Failed to download Excel report.');
      console.error(err);
    } finally {
      setDownloadingExcel(false);
    }
  };

  if (loading || !summary) {
    return (
      <DashboardLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const zoneData = [
    { name: 'AVAILABLE', value: summary.total_stock - summary.quarantined_items - summary.expired_items },
    { name: 'QUARANTINED', value: summary.quarantined_items },
    { name: 'EXPIRED', value: summary.expired_items },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className='flex justify-between'>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <LayoutDashboard size={24} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Welcome back {user?.name}!</p>
          </div>

          <div className="flex justify-end mb-4">
            <Button onClick={handleDownloadExcel} disabled={downloadingExcel} className="gap-2">
              {downloadingExcel ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              {downloadingExcel ? 'Generating...' : 'Download Full Inventory (.xlsx)'}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_products.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Registered in master data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
              <Boxes className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_stock.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total items in warehouse</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inbound Today</CardTitle>
              <Download className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">{summary.inbound_today.toLocaleString()}</div>
                {summary.inbound_today > 0 && <span className="flex items-center text-xs text-emerald-500 font-medium"><ArrowUpRight className="h-3 w-3" /> Active</span>}
              </div>
              <p className="text-xs text-muted-foreground">Items received today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outbound Today</CardTitle>
              <Upload className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">{summary.outbound_today.toLocaleString()}</div>
                {summary.outbound_today > 0 && <span className="flex items-center text-xs text-blue-500 font-medium"><ArrowUpRight className="h-3 w-3" /> Active</span>}
              </div>
              <p className="text-xs text-muted-foreground">Items dispatched today</p>
            </CardContent>
          </Card>
        </div>

        {summary.near_expired_count > 0 && (
          <div className="w-full">
            <Alert variant="destructive" className="bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 stroke-amber-600 dark:stroke-amber-400" />
              <AlertTitle className="font-semibold">Action Required: Inventory Aging</AlertTitle>
              <AlertDescription>
                You have {summary.near_expired_count} batch(es) of stock expiring within the next 30 days. Please review the Inventory Monitor.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Warehouse Throughput</CardTitle>
                  <CardDescription>Monthly stock movement overview for the last 6 months.</CardDescription>
                </div>
                <div className="p-2 bg-primary/5 rounded-full text-primary">
                  <BarChart3 size={20} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.throughput || []}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Inventory Health</CardTitle>
              <CardDescription>Distribution of active, quarantined, and expired stock.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex flex-col items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={zoneData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {zoneData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-xs font-medium mt-4 w-full">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-900" /> Avail: {zoneData[0].value}
                </div>
                <div className="flex items-center gap-1.5 text-red-500">
                  <div className="w-3 h-3 rounded-full bg-red-500" /> Quar: {zoneData[1].value}
                </div>
                <div className="flex items-center gap-1.5 text-amber-500">
                  <div className="w-3 h-3 rounded-full bg-amber-500" /> Exp: {zoneData[2].value}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
