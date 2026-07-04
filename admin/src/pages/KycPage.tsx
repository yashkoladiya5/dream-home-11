import { useState, useEffect, useCallback } from 'react';
import { Search, Check, XCircle, RefreshCw, Eye, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { type ApiResponse, type KycEntry } from '../lib/api';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
];

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  approved: 'Verified',
  rejected: 'Rejected',
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function KycPage() {
  const [entries, setEntries] = useState<KycEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState('');
  const limit = 20;

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<KycEntry | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedUserId = useDebounce(userId, 400);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (debouncedUserId) params.userId = debouncedUserId;
      if (status) params.status = status;

      const { data } = await api.get<ApiResponse<KycEntry[]>>('/admin/kyc', { params });
      setEntries(data.data);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      toast.error('Failed to load KYC submissions');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedUserId, status]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    setPage(1);
  }, [debouncedUserId, status]);

  const handleApprove = async () => {
    if (!selectedEntry) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/kyc/${selectedEntry._id}/approve`);
      toast.success('KYC approved successfully');
      setShowApproveModal(false);
      setShowDetailsModal(false);
      setSelectedEntry(null);
      fetchEntries();
    } catch {
      toast.error('Failed to approve KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEntry || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/kyc/${selectedEntry._id}/reject`, { reason: rejectReason.trim() });
      toast.success('KYC rejected');
      setShowRejectModal(false);
      setShowDetailsModal(false);
      setSelectedEntry(null);
      setRejectReason('');
      fetchEntries();
    } catch {
      toast.error('Failed to reject KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (entry: KycEntry) => {
    setSelectedEntry(entry);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const columns = [
    {
      key: 'userName',
      header: 'User Profile',
      render: (e: KycEntry) => (
        <div className="flex flex-col">
          <span className="font-semibold text-white">{e.userName || 'Unnamed User'}</span>
          <span className="text-[10px] text-slate-500 font-mono tracking-tighter">{e.userId}</span>
        </div>
      ),
    },
    { key: 'userPhone', header: 'Phone', render: (e: KycEntry) => <span className="text-slate-400 font-medium">{e.userPhone || '—'}</span> },
    {
      key: 'documentType',
      header: 'Documents Submitted',
      render: (e: KycEntry) => {
        const docs = [];
        if (e.aadhaarNumber) docs.push('Aadhaar');
        if (e.panNumber) docs.push('PAN');
        if (e.selfieUrl) docs.push('Selfie');
        
        return (
          <div className="flex flex-wrap gap-1">
            {docs.map((d) => (
              <span key={d} className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700/50">
                {d}
              </span>
            ))}
            {docs.length === 0 && <span className="text-slate-500 text-xs">No Uploads</span>}
          </div>
        );
      },
    },
    {
      key: 'documentUrl',
      header: 'KYC Document Review',
      render: (e: KycEntry) => (
        <button
          onClick={(ev) => {
            ev.stopPropagation();
            setSelectedEntry(e);
            setShowDetailsModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-400 hover:text-white bg-brand-500/5 hover:bg-brand-500/10 border border-brand-500/10 hover:border-brand-500/30 transition-all duration-300 shadow-sm"
        >
          <Eye size={12} />
          View Details
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Verification Status',
      render: (e: KycEntry) => (
        <Badge variant={statusVariant[e.status] ?? 'default'}>
          {statusLabel[e.status] ?? e.status}
        </Badge>
      ),
    },
    { key: 'submittedAt', header: 'Submitted At', render: (e: KycEntry) => <span className="text-slate-500 text-xs font-semibold">{formatDate(e.submittedAt)}</span> },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (e: KycEntry) =>
        e.status === 'pending' ? (
          <div className="flex gap-1.5 justify-end" onClick={(ev) => ev.stopPropagation()}>
            <button
              onClick={() => {
                setSelectedEntry(e);
                setShowApproveModal(true);
              }}
              className="p-2 rounded-xl text-emerald-400 hover:text-white bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 shadow-sm"
              title="Approve"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => openRejectModal(e)}
              className="p-2 rounded-xl text-rose-400 hover:text-white bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/30 transition-all duration-300 shadow-sm"
              title="Reject"
            >
              <XCircle size={14} />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">KYC Submissions</h1>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Approve, reject, and review uploaded identity documents</p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />} onClick={fetchEntries} className="shrink-0">
          Refresh List
        </Button>
      </div>

      {/* Filter panel */}
      <div className="backdrop-blur-md bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by User ID..."
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          <div className="w-full sm:w-52">
            <Select options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Table */}
      <Table<KycEntry>
        columns={columns}
        data={entries}
        loading={loading}
        onRowClick={(entry) => {
          setSelectedEntry(entry);
          setShowDetailsModal(true);
        }}
        emptyMessage="No KYC submissions found"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end pt-2">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Approve Dialog */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedEntry(null);
        }}
        title="Approve KYC Profile"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowApproveModal(false);
                setSelectedEntry(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" loading={actionLoading} onClick={handleApprove}>
              Approve KYC
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs font-semibold text-emerald-400">
            <AlertCircle size={16} />
            This will verify the user's details and grant access to app withdrawals.
          </div>
          <p className="text-sm text-slate-300">
            Are you sure you want to approve KYC for <strong className="text-white">{selectedEntry?.userName}</strong>?
          </p>
        </div>
      </Modal>

      {/* Reject Dialog */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedEntry(null);
          setRejectReason('');
        }}
        title="Reject KYC Profile"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedEntry(null);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={actionLoading}
              disabled={!rejectReason.trim()}
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs font-semibold text-rose-400">
            <AlertCircle size={16} />
            This will reject the user's KYC and notify them of the reason.
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Rejection Reason</label>
            <textarea
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              placeholder="e.g. Aadhaar number mismatch or blurred photos"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Details View Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEntry(null);
        }}
        title="KYC Verification Details"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedEntry(null);
              }}
            >
              Close
            </Button>
            {selectedEntry?.status === 'pending' && (
              <>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (selectedEntry) {
                      setRejectReason('');
                      setShowRejectModal(true);
                    }
                  }}
                >
                  Reject Submission
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowApproveModal(true);
                  }}
                >
                  Verify Profile
                </Button>
              </>
            )}
          </>
        }
      >
        {selectedEntry && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-800/60 pb-4">
              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider">User Name:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedEntry.userName || 'Unnamed User'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider">Phone:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedEntry.userPhone || '—'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider">User ID:</span>
                <p className="font-mono text-[10px] text-slate-400 select-all mt-0.5">{selectedEntry.userId}</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider">Status:</span>
                <div className="mt-0.5">
                  <Badge variant={statusVariant[selectedEntry.status] ?? 'default'}>
                    {statusLabel[selectedEntry.status] ?? selectedEntry.status}
                  </Badge>
                </div>
              </div>
            </div>

            {selectedEntry.status === 'rejected' && selectedEntry.rejectionReason && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-sm text-rose-300">
                <span className="font-bold text-xs uppercase tracking-wide">Rejection Reason:</span>
                <p className="mt-1 font-medium">{selectedEntry.rejectionReason}</p>
              </div>
            )}

            {/* Document Numbers */}
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-800/60 pb-4">
              {selectedEntry.aadhaarNumber && (
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Aadhaar Number:</span>
                  <p className="font-bold text-white mt-1 text-sm tracking-widest">{selectedEntry.aadhaarNumber}</p>
                </div>
              )}
              {selectedEntry.panNumber && (
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider">PAN Card Number:</span>
                  <p className="font-bold text-white mt-1 text-sm tracking-widest uppercase">{selectedEntry.panNumber}</p>
                </div>
              )}
            </div>

            {/* Images Grid */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Uploaded Identity Documents</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedEntry.aadhaarFrontUrl && (
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2 shadow-inner">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Aadhaar Card Front</span>
                    <a
                      href={selectedEntry.aadhaarFrontUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950/80"
                    >
                      <img
                        src={selectedEntry.aadhaarFrontUrl}
                        alt="Aadhaar Front"
                        className="w-full h-36 object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-semibold">
                        View Full Screen
                      </div>
                    </a>
                  </div>
                )}

                {selectedEntry.aadhaarBackUrl && (
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2 shadow-inner">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Aadhaar Card Back</span>
                    <a
                      href={selectedEntry.aadhaarBackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950/80"
                    >
                      <img
                        src={selectedEntry.aadhaarBackUrl}
                        alt="Aadhaar Back"
                        className="w-full h-36 object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-semibold">
                        View Full Screen
                      </div>
                    </a>
                  </div>
                )}

                {selectedEntry.panCardUrl && (
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2 shadow-inner">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PAN Card Image</span>
                    <a
                      href={selectedEntry.panCardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950/80"
                    >
                      <img
                        src={selectedEntry.panCardUrl}
                        alt="PAN Card"
                        className="w-full h-36 object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-semibold">
                        View Full Screen
                      </div>
                    </a>
                  </div>
                )}

                {selectedEntry.selfieUrl && (
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2 shadow-inner">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Selfie Photo</span>
                    <a
                      href={selectedEntry.selfieUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950/80"
                    >
                      <img
                        src={selectedEntry.selfieUrl}
                        alt="Selfie"
                        className="w-full h-36 object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-semibold">
                        View Full Screen
                      </div>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
