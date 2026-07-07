import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Users, Banknote } from 'lucide-react';
import api from '../lib/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const EXPORT_OPTIONS = [
  {
    type: 'transactions' as const,
    label: 'Export Transactions',
    description: 'Download all transaction records as a JSON file.',
    icon: <Banknote className="h-5 w-5" />,
  },
  {
    type: 'users' as const,
    label: 'Export Users',
    description: 'Download all user data as a JSON file.',
    icon: <Users className="h-5 w-5" />,
  },
];

export default function ReportsPage() {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: 'transactions' | 'users') => {
    setExporting(type);
    try {
      const { data } = await api.post('/admin/reports/export', { type });
      const json = JSON.stringify(data.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`${type === 'transactions' ? 'Transactions' : 'Users'} exported successfully`);
    } catch {
      toast.error(`Failed to export ${type}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Reports</h1>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Export platform data as downloadable JSON files</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {EXPORT_OPTIONS.map(({ type, label, description, icon }) => (
          <Card key={type} className="p-5">
            <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400">
                {icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">{label}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              </div>
            </div>
            <div className="pt-4">
              <Button
                onClick={() => handleExport(type)}
                loading={exporting === type}
                icon={exporting !== type ? <Download className="h-4 w-4" /> : undefined}
                className="w-full"
              >
                {exporting === type ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
