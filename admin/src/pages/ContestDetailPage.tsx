import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { type ApiResponse } from '../lib/api';
import Table from '../components/ui/Table';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';

interface ContestMember {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  pointsEarned: number;
  joinedAt: string;
}

interface ContestDetail {
  id: string;
  title: string;
  entryFee: number;
  totalPrize: number;
  maxSlots: number;
  filledSlots: number;
  status: 'upcoming' | 'running' | 'completed' | 'cancelled';
  type: 'mega' | 'head-to-head' | 'mega-pool' | 'private';
  startTime: string;
  endTime: string;
  inviteCode?: string;
  members: ContestMember[];
  compensated?: boolean;
}

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  running: 'success',
  upcoming: 'info',
  completed: 'default',
  cancelled: 'error',
};

export default function ContestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contest, setContest] = useState<ContestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [compensating, setCompensating] = useState(false);
  const [showCompensateModal, setShowCompensateModal] = useState(false);

  const fetchContest = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<ContestDetail>>(`/admin/contests/${id}`);
      setContest(data.data);
    } catch {
      toast.error('Failed to load contest details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContest();
  }, [id]);

  const handleCompensate = async () => {
    if (!id) return;
    setCompensating(true);
    try {
      await api.post(`/admin/contests/${id}/compensate`);
      toast.success('Compensation triggered successfully');
      setShowCompensateModal(false);
      fetchContest();
    } catch {
      toast.error('Failed to trigger compensation');
    } finally {
      setCompensating(false);
    }
  };

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const memberColumns = [
    { key: 'userName', header: 'User Name', render: (m: ContestMember) => <span className="font-medium text-white">{m.userName}</span> },
    { key: 'userPhone', header: 'Phone', render: (m: ContestMember) => m.userPhone },
    { key: 'pointsEarned', header: 'Points Earned', render: (m: ContestMember) => m.pointsEarned.toLocaleString() },
    { key: 'joinedAt', header: 'Joined At', render: (m: ContestMember) => formatDate(m.joinedAt) },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p>Contest not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/contests')}>
          Back to Contests
        </Button>
      </div>
    );
  }

  const showCompensateButton = contest.status === 'completed' && !contest.compensated;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/contests')}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-700"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{contest.title}</h1>
          <p className="text-sm text-slate-400">Contest Details</p>
        </div>
      </div>

      <Card title="Contest Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <p className="text-sm text-slate-400">Entry Fee</p>
            <p className="text-lg font-semibold text-white">{formatCurrency(contest.entryFee)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Total Prize</p>
            <p className="text-lg font-semibold text-white">{formatCurrency(contest.totalPrize)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Slots</p>
            <p className="text-lg font-semibold text-white">
              {contest.filledSlots}/{contest.maxSlots}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Status</p>
            <Badge variant={statusVariant[contest.status] ?? 'default'}>{contest.status}</Badge>
          </div>
          <div>
            <p className="text-sm text-slate-400">Type</p>
            <p className="text-lg font-semibold text-white capitalize">{contest.type.replace(/-/g, ' ')}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Start Time</p>
            <p className="text-sm font-medium text-white">{formatDate(contest.startTime)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">End Time</p>
            <p className="text-sm font-medium text-white">{formatDate(contest.endTime)}</p>
          </div>
          {contest.inviteCode && (
            <div>
              <p className="text-sm text-slate-400">Invite Code</p>
              <p className="text-sm font-mono font-semibold text-white">{contest.inviteCode}</p>
            </div>
          )}
        </div>
      </Card>

      <Card
        title="Members"
        actions={
          showCompensateButton ? (
            <Button
              variant="danger"
              icon={<DollarSign size={16} />}
              onClick={() => setShowCompensateModal(true)}
            >
              Compensate
            </Button>
          ) : contest.compensated ? (
            <Badge variant="success">Compensated</Badge>
          ) : null
        }
      >
        <Table<ContestMember>
          columns={memberColumns}
          data={contest.members ?? []}
          emptyMessage="No members joined yet"
        />
      </Card>

      <Modal
        isOpen={showCompensateModal}
        onClose={() => setShowCompensateModal(false)}
        title="Confirm Compensation"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowCompensateModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={compensating} onClick={handleCompensate}>
              Confirm Compensation
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          Are you sure you want to trigger compensation for all members of this contest? This action
          cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
