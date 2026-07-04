import { useState } from 'react';
import toast from 'react-hot-toast';
import { Send, MessageSquare, AlertTriangle } from 'lucide-react';
import api from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Tabs from '../components/ui/Tabs';
import Modal from '../components/ui/Modal';

const TIER_OPTIONS = [
  { value: '', label: 'All Users' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
];

function PushNotificationsTab() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [tier, setTier] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await api.post('/admin/notifications/broadcast', {
        title,
        message,
        tier: tier || undefined,
      });
      toast.success('Push notification sent successfully');
      setTitle('');
      setMessage('');
      setTier('');
    } catch {
      toast.error('Failed to send push notification');
    } finally {
      setSending(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Notification title"
      />
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Type your notification message..."
        />
        <p className="mt-1 text-xs text-slate-500">{message.length} characters</p>
      </div>
      <div className="w-48">
        <Select
          label="Target Tier"
          options={TIER_OPTIONS}
          value={tier}
          onChange={(e) => setTier(e.target.value)}
        />
      </div>
      <Button
        onClick={() => {
          if (!title.trim() || !message.trim()) {
            toast.error('Title and message are required');
            return;
          }
          setConfirmOpen(true);
        }}
        icon={<Send className="h-4 w-4" />}
        disabled={!title.trim() || !message.trim()}
      >
        Send Push Notification
      </Button>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Broadcast"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} loading={sending}>
              Send Now
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            This will send a push notification to {tier || 'all'} users.
          </div>
          <div className="text-sm">
            <p className="font-medium">{title}</p>
            <p className="text-slate-400 mt-1">{message}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SmsBroadcastTab() {
  const [message, setMessage] = useState('');
  const [tier, setTier] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const overLimit = message.length > 160;

  const handleSend = async () => {
    setSending(true);
    try {
      await api.post('/admin/notifications/broadcast-sms', {
        message,
        tier: tier || undefined,
      });
      toast.success('SMS broadcast sent successfully');
      setMessage('');
      setTier('');
    } catch {
      toast.error('Failed to send SMS broadcast');
    } finally {
      setSending(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className={`w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 transition-colors focus:outline-none focus:ring-1 ${
            overLimit
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500'
          }`}
          placeholder="Type your SMS message..."
        />
        <p className={`mt-1 text-xs ${overLimit ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
          {message.length}/160 characters
          {overLimit && ' — Message exceeds 160 character limit'}
        </p>
      </div>
      <div className="w-48">
        <Select
          label="Target Tier"
          options={TIER_OPTIONS}
          value={tier}
          onChange={(e) => setTier(e.target.value)}
        />
      </div>
      <Button
        onClick={() => {
          if (!message.trim()) {
            toast.error('Message is required');
            return;
          }
          if (overLimit) {
            toast.error('Message exceeds 160 character limit');
            return;
          }
          setConfirmOpen(true);
        }}
        icon={<MessageSquare className="h-4 w-4" />}
        disabled={!message.trim() || overLimit}
      >
        Send SMS
      </Button>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm SMS Broadcast"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} loading={sending}>
              Send Now
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            This will send an SMS to {tier || 'all'} users. Carrier charges may apply.
          </div>
          <p className="text-sm text-slate-300">{message}</p>
        </div>
      </Modal>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-sm text-slate-500 mt-1">Send push notifications and SMS broadcasts</p>
      </div>

      <div className="admin-card p-6">
        <Tabs
          tabs={[
            { key: 'push', label: 'Push Notifications', content: <PushNotificationsTab /> },
            { key: 'sms', label: 'SMS Broadcast', content: <SmsBroadcastTab /> },
          ]}
        />
      </div>
    </div>
  );
}
