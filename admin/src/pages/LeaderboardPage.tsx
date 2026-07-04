import { useState } from 'react';
import { RefreshCw, RotateCcw, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

export default function LeaderboardPage() {
  const [contestId, setContestId] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncingContest, setSyncingContest] = useState(false);
  const [resetType, setResetType] = useState<'weekly' | 'monthly' | null>(null);
  const [resetting, setResetting] = useState(false);

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      await api.post('/leaderboard/sync');
      toast.success('Full leaderboard synced successfully');
    } catch {
      toast.error('Failed to sync leaderboard');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncContest = async () => {
    if (!contestId.trim()) {
      toast.error('Please enter a contest ID');
      return;
    }
    setSyncingContest(true);
    try {
      await api.post(`/leaderboard/sync/contest/${contestId.trim()}`);
      toast.success('Contest leaderboard synced successfully');
      setContestId('');
    } catch {
      toast.error('Failed to sync contest leaderboard');
    } finally {
      setSyncingContest(false);
    }
  };

  const handleReset = async () => {
    if (!resetType) return;
    setResetting(true);
    try {
      await api.post(`/leaderboard/reset/${resetType}`);
      toast.success(`${resetType === 'weekly' ? 'Weekly' : 'Monthly'} leaderboard reset successfully`);
      setResetType(null);
    } catch {
      toast.error(`Failed to reset ${resetType} leaderboard`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Leaderboard Admin</h1>
        <p className="text-sm text-slate-400 mt-1">Sync and reset leaderboards</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Sync Leaderboard" actions={<Trophy size={20} className="text-slate-500" />}>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-300 mb-3">
                Sync the full leaderboard to recalculate rankings for all users.
              </p>
              <Button
                variant="primary"
                icon={<RefreshCw size={16} />}
                loading={syncing}
                onClick={handleSyncAll}
              >
                Sync Full Leaderboard
              </Button>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <p className="text-sm text-slate-300 mb-3">
                Sync leaderboard for a specific contest.
              </p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter Contest ID"
                    value={contestId}
                    onChange={(e) => setContestId(e.target.value)}
                  />
                </div>
                <Button
                  variant="secondary"
                  icon={<RefreshCw size={16} />}
                  loading={syncingContest}
                  onClick={handleSyncContest}
                >
                  Sync
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Reset Leaderboard" actions={<RotateCcw size={20} className="text-slate-500" />}>
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              Reset leaderboard rankings. This will clear all current rankings and require a re-sync.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="danger"
                icon={<RotateCcw size={16} />}
                onClick={() => setResetType('weekly')}
              >
                Reset Weekly Leaderboard
              </Button>
              <Button
                variant="danger"
                icon={<RotateCcw size={16} />}
                onClick={() => setResetType('monthly')}
              >
                Reset Monthly Leaderboard
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={resetType !== null}
        onClose={() => setResetType(null)}
        title={`Reset ${resetType === 'weekly' ? 'Weekly' : 'Monthly'} Leaderboard`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setResetType(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={resetting} onClick={handleReset}>
              Reset
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          Are you sure you want to reset the{' '}
          <strong>{resetType === 'weekly' ? 'weekly' : 'monthly'}</strong> leaderboard? This action
          cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
