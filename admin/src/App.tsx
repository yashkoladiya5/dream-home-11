import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import UsersPage from '@/pages/UsersPage';
import UserDetailPage from '@/pages/UserDetailPage';
import ContestsPage from '@/pages/ContestsPage';
import ContestDetailPage from '@/pages/ContestDetailPage';
import ContestCreatePage from '@/pages/ContestCreatePage';
import PrizeHomesPage from '@/pages/PrizeHomesPage';
import BannersPage from '@/pages/BannersPage';
import WarningsPage from '@/pages/WarningsPage';
import FraudDashboardPage from '@/pages/FraudDashboardPage';
import KycPage from '@/pages/KycPage';
import ConfigPage from '@/pages/ConfigPage';
import SupportPage from '@/pages/SupportPage';
import NotificationsPage from '@/pages/NotificationsPage';
import AuditLogsPage from '@/pages/AuditLogsPage';
import CompensationsPage from '@/pages/CompensationsPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import PaymentsPage from '@/pages/PaymentsPage';
import WithdrawalsPage from '@/pages/WithdrawalsPage';
import RewardsPage from '@/pages/RewardsPage';
import ReferralsPage from '@/pages/ReferralsPage';
import PollsPage from '@/pages/PollsPage';
import ReportsPage from '@/pages/ReportsPage';

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="contests" element={<ContestsPage />} />
          <Route path="contests/create" element={<ContestCreatePage />} />
          <Route path="contests/:id" element={<ContestDetailPage />} />
          <Route path="contests/:id/edit" element={<ContestCreatePage />} />
          <Route path="prize-homes" element={<PrizeHomesPage />} />
          <Route path="banners" element={<BannersPage />} />
          <Route path="warnings" element={<WarningsPage />} />
          <Route path="fraud" element={<FraudDashboardPage />} />
          <Route path="kyc" element={<KycPage />} />
          <Route path="config" element={<ConfigPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="compensations" element={<CompensationsPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="withdrawals" element={<WithdrawalsPage />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="referrals" element={<ReferralsPage />} />
          <Route path="polls" element={<PollsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
