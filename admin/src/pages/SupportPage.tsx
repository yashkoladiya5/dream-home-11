import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { Ticket } from '../lib/api';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'technical', label: 'Technical' },
  { value: 'payment', label: 'Payment' },
  { value: 'kyc', label: 'KYC' },
  { value: 'account', label: 'General' },
  { value: 'other', label: 'Other' },
];

const statusVariant: Record<string, 'info' | 'warning' | 'success' | 'neutral'> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'neutral',
};

const statusLabel: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const categoryVariant: Record<string, 'info' | 'success' | 'warning' | 'neutral'> = {
  technical: 'info',
  payment: 'success',
  kyc: 'warning',
  account: 'info',
  other: 'neutral',
};

const categoryLabel: Record<string, string> = {
  technical: 'Technical',
  payment: 'Payment',
  kyc: 'KYC',
  account: 'General',
  other: 'Other',
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState('');

  useEffect(() => {
    if (selectedTicket) {
      setStatusToUpdate(selectedTicket.status);
    }
  }, [selectedTicket]);

  useEffect(() => {
    fetchTickets();
  }, [page, status, category]);

  const handleStatusUpdate = async () => {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/admin/support-tickets/${selectedTicket._id}/status`, {
        status: statusToUpdate,
      });
      toast.success('Ticket status updated successfully');
      setSelectedTicket(null);
      fetchTickets();
    } catch {
      toast.error('Failed to update ticket status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      if (category) params.set('category', category);
      const { data } = await api.get(`/admin/support-tickets?${params}`);
      setTickets(data.data);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
        <p className="text-sm text-slate-500 mt-1">Manage user support requests</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="w-48">
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-48">
          <Select
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Phone</th>
              <th>Subject</th>
              <th>Category</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}>
                      <div className="h-4 bg-slate-700 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-500">
                  No support tickets found
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket._id}>
                  <td className="font-medium text-white">{ticket.userName}</td>
                  <td className="text-slate-400">{ticket.userPhone}</td>
                  <td className="text-white max-w-[200px] truncate">{ticket.subject}</td>
                  <td>
                    <Badge variant={categoryVariant[ticket.category] || 'neutral'}>
                      {categoryLabel[ticket.category] || ticket.category}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={statusVariant[ticket.status] || 'neutral'}>
                      {statusLabel[ticket.status] || ticket.status}
                    </Badge>
                  </td>
                  <td className="text-slate-500 text-xs">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      icon={<Eye className="h-4 w-4" />}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              icon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title="Ticket Details"
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">User:</span>
                <p className="font-medium">{selectedTicket.userName}</p>
              </div>
              <div>
                <span className="text-slate-500">Phone:</span>
                <p className="font-medium">{selectedTicket.userPhone}</p>
              </div>
              <div>
                <span className="text-slate-500">Category:</span>
                <p className="font-medium">{categoryLabel[selectedTicket.category]}</p>
              </div>
              <div>
                <span className="text-slate-500">Status:</span>
                <p className="font-medium">{statusLabel[selectedTicket.status]}</p>
              </div>
            </div>
            <div>
              <span className="text-slate-500 text-sm">Subject:</span>
              <p className="font-medium mt-1">{selectedTicket.subject}</p>
            </div>
             <div>
              <span className="text-slate-500 text-sm">Message:</span>
              <p className="mt-1 text-sm text-slate-200 bg-slate-800 border border-slate-700 rounded-lg p-3 whitespace-pre-wrap">
                {selectedTicket.message}
              </p>
            </div>
            
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <label className="block text-sm font-medium text-slate-300">Update Status</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    options={[
                      { value: 'open', label: 'Open' },
                      { value: 'in_progress', label: 'In Progress' },
                      { value: 'resolved', label: 'Resolved' },
                      { value: 'closed', label: 'Closed' },
                    ]}
                    value={statusToUpdate}
                    onChange={(e) => setStatusToUpdate(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleStatusUpdate}
                  loading={updatingStatus}
                  disabled={statusToUpdate === selectedTicket.status}
                >
                  Update
                </Button>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Created: {new Date(selectedTicket.createdAt).toLocaleString()}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
