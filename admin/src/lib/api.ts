import axios from 'axios';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  runningContests: number;
  pendingKyc: number;
  totalDeposits: number;
  openTickets: number;
}

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  kycStatus: 'pending' | 'approved' | 'rejected' | 'none';
  walletBalance: number;
  isActive: boolean;
  role: 'user' | 'admin' | 'moderator';
  createdAt: string;
}

export interface Contest {
  id: string;
  title: string;
  entryFee: number;
  totalPrize: number;
  maxSlots: number;
  filledSlots: number;
  status: 'upcoming' | 'running' | 'completed' | 'cancelled';
  type: 'normal' | 'mega' | 'home' | 'private';
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface KycEntry {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  documentType: 'aadhaar' | 'pan' | 'passport' | 'driving_license';
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  panCardUrl?: string;
  selfieUrl?: string;
  dateOfBirth?: string;
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: 'payment' | 'contest' | 'kyc' | 'account' | 'other';
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target: string;
  targetType: string;
  ip: string;
  details?: string;
  createdAt: string;
}

export interface Config {
  minDeposit: number;
  maxDeposit: number;
  platformFeePercent: number;
  referralBonus: number;
  signupBonus: number;
  featureFlags: Record<string, boolean>;
  restrictedStates: string[];
}

export interface NotificationPayload {
  title: string;
  message: string;
  tier?: string;
}

export interface Compensation {
  id: string;
  contestId: string;
  contestTitle: string;
  amount: number;
  status: 'pending' | 'processed' | 'failed';
  affectedUsers: number;
  reason: string;
  createdAt: string;
  processedAt?: string;
}

export interface PrizeHome {
  id: string;
  name: string;
  description: string;
  images: string[];
  location: string;
  city: string;
  value: number;
  bhk?: number;
  area?: string;
  amenities?: string[];
  specs?: Record<string, string>;
  isActive: boolean;
  featured: boolean;
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  linkType?: 'contest' | 'prize_home' | 'web' | 'none';
  linkId?: string;
  isActive: boolean;
  order: number;
  bgColor?: string;
  createdAt: string;
}

export interface Warning {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  level: 1 | 2 | 3;
  reason: string;
  pointsDeducted: number;
  status: 'active' | 'expired' | 'resolved';
  issuedBy: string;
  issuedByName: string;
  expiresAt?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface FraudAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  rule: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  resolvedBy?: string;
  resolvedAt?: string;
  ipAddress?: string;
  deviceId?: string;
  flaggedField?: string;
  score: number;
  createdAt: string;
}

export interface FraudStats {
  totalAlerts: number;
  openAlerts: number;
  criticalAlerts: number;
  resolvedToday: number;
  alertsBySeverity: { severity: string; count: number }[];
  topRules: { rule: string; count: number }[];
  alertsByDay: { date: string; count: number }[];
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const mapApiObject = (item: any): any => {
  if (!item || typeof item !== 'object') return item;

  if (Array.isArray(item)) {
    return item.map(mapApiObject);
  }

  const mapped: any = { ...item };

  // Sync id and _id in both directions
  if ('id' in mapped && !('_id' in mapped)) {
    mapped._id = mapped.id;
  }
  if ('_id' in mapped && !('id' in mapped)) {
    mapped.id = mapped._id;
  }

  // If it's a User object (has phoneNumber or walletBalanceInr)
  if ('phoneNumber' in mapped || 'walletBalanceInr' in mapped) {
    mapped.phone = mapped.phoneNumber;
    mapped.walletBalance = Number(mapped.walletBalanceInr || 0);
  }

  // If it's a Kyc object (has user object and either aadhaarNumber, panNumber, status, or selfieUrl)
  if ('aadhaarNumber' in mapped || 'panNumber' in mapped || 'selfieUrl' in mapped) {
    mapped.userName = mapped.user?.fullName || mapped.user?.phoneNumber || '';
    mapped.userPhone = mapped.user?.phoneNumber || '';
    mapped.documentType = mapped.panNumber ? 'pan' : 'aadhaar';
    mapped.documentUrl = mapped.panCardUrl || mapped.aadhaarFrontUrl || '';
    mapped.submittedAt = mapped.verifiedAt || mapped.createdAt || new Date().toISOString();
  }

  // If it's a Compensation object (has entryFeeInr and compensationPoints)
  if ('entryFeeInr' in mapped && 'compensationPoints' in mapped) {
    mapped.entryFee = Number(mapped.entryFeeInr || 0);
    mapped.points = Number(mapped.compensationPoints || 0);
    mapped.userPhone = mapped.user?.phoneNumber || '';
  }

  // If it's a ContestMember object (has pointsEarned and user object)
  if ('pointsEarned' in mapped && mapped.user) {
    mapped.userName = mapped.user.fullName || mapped.user.phoneNumber || '';
    mapped.userPhone = mapped.user.phoneNumber || '';
  }

  // If it's a Transaction object (has cashAmount)
  if ('cashAmount' in mapped) {
    mapped.amount = Number(mapped.cashAmount || 0);
    if (mapped.user) {
      mapped.userName = mapped.user?.fullName || mapped.user?.phoneNumber || '';
      mapped.userPhone = mapped.user?.phoneNumber || '';
    }
  }

  // If it's a Ticket object (has subject, message, and user relation)
  if ('subject' in mapped && 'message' in mapped && mapped.user) {
    mapped.userName = mapped.user.fullName || mapped.user.phoneNumber || '';
    mapped.userPhone = mapped.user.phoneNumber || '';
  }

  // If it's an AuditLog object (has adminId and ipAddress or targetId)
  if ('adminId' in mapped && ('ipAddress' in mapped || 'targetId' in mapped)) {
    mapped.target = mapped.targetId || '';
    mapped.ip = mapped.ipAddress || '';
    mapped.details = mapped.metadata ? JSON.stringify(mapped.metadata) : '';
  }

  // If it's a Contest object (has entryFeeInr or pointsToJoin)
  if ('entryFeeInr' in mapped || 'pointsToJoin' in mapped) {
    mapped.entryFee = Number(mapped.entryFeeInr || mapped.entryFee || 0);

    // Parse totalPrize from prize
    let totalPrize = 0;
    if (typeof mapped.prize === 'string') {
      const cleaned = mapped.prize.replace(/,/g, '');
      const match = cleaned.match(/\d+/);
      if (match) {
        totalPrize = Number(match[0]);
      } else {
        if (mapped.type === 'mega' || mapped.title?.toLowerCase().includes('mega')) {
          totalPrize = 12000000;
        } else {
          totalPrize = 50000;
        }
      }
    } else if (typeof mapped.prize === 'number') {
      totalPrize = mapped.prize;
    }
    mapped.totalPrize = totalPrize;
    mapped.compensated = mapped.compensationStatus === 'processed';
  }

  // Recursively map any nested properties
  for (const key of Object.keys(mapped)) {
    if (mapped[key] && typeof mapped[key] === 'object') {
      mapped[key] = mapApiObject(mapped[key]);
    }
  }

  return mapped;
};

api.interceptors.response.use(
  (response) => {
    let data = response.data;

    // Preprocess and map properties recursively (e.g. id -> _id, entryFeeInr -> entryFee)
    data = mapApiObject(data);

    // If it's already in standard ApiResponse format, pass it through
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      // Check if data.data is accidentally containing a paginated object that was not unwrapped
      const payload = data.data;
      if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        const keys = Object.keys(payload);
        const listKey = keys.find((key) => Array.isArray(payload[key]));

        if (listKey && 'total' in payload && 'page' in payload && 'limit' in payload) {
          const total = Number(payload.total);
          const limit = Number(payload.limit);
          const page = Number(payload.page);

          const standardKeys = new Set([listKey, 'total', 'page', 'limit']);
          const extra: Record<string, any> = {};
          for (const key of Object.keys(payload)) {
            if (!standardKeys.has(key)) {
              extra[key] = payload[key];
            }
          }

          response.data = {
            success: true,
            data: payload[listKey],
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit) || 1,
            },
            ...extra,
          };
          return response;
        }
      }
      
      response.data = data;
      return response;
    }

    // Detect if this is a paginated response from NestJS (e.g. { contests, total, page, limit })
    if (data && typeof data === 'object') {
      const keys = Object.keys(data);
      const listKey = keys.find((key) => Array.isArray(data[key]));

      if (listKey && 'total' in data && 'page' in data && 'limit' in data) {
        const total = Number(data.total);
        const limit = Number(data.limit);
        const page = Number(data.page);

        const standardKeys = new Set([listKey, 'total', 'page', 'limit']);
        const extra: Record<string, any> = {};
        for (const key of Object.keys(data)) {
          if (!standardKeys.has(key)) {
            extra[key] = data[key];
          }
        }

        response.data = {
          success: true,
          data: data[listKey],
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
          },
          ...extra,
        };
        return response;
      }
    }

    // Default wrapper for non-paginated successful endpoints
    response.data = {
      success: true,
      data,
    };
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
