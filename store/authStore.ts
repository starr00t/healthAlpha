import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserProfile, UserSubscription, SubscriptionTier } from '@/types/user';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (name: string) => void;
  updateHealthProfile: (profile: UserProfile) => void;
  updateSubscription: (subscription: UserSubscription) => void;
  upgradeToPremium: (tier: SubscriptionTier) => boolean;
  incrementAIUsage: () => boolean;
  canUseAI: () => boolean;
  getAllUsers: () => StoredUser[];
  deleteUser: (userId: string) => boolean;
  updateUserAdmin: (userId: string, isAdmin: boolean) => boolean;
  updateUserSubscription: (userId: string, subscription: UserSubscription) => boolean;
  grantPremiumAccess: (userId: string, tier: SubscriptionTier, duration?: number) => boolean;
}

// 간단한 사용자 저장소 (실제 프록덕션에서는 백엔드 API 사용)
interface StoredUser {
  email: string;
  password: string; // 실제로는 해시되어야 함
  name: string;
  id: string;
  createdAt: string;
  isAdmin?: boolean;
  profile?: UserProfile;
  subscription?: UserSubscription;
}

const USERS_KEY = 'health-alpha-users';

const getStoredUsers = (): StoredUser[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(USERS_KEY);
  const users = stored ? JSON.parse(stored) : [];
  
  // 기본 관리자 계정이 없으면 생성
  if (!users.some((u: StoredUser) => u.isAdmin)) {
    users.push({
      id: 'admin-001',
      email: 'admin@health.com',
      password: 'admin123', // 실제로는 해시되어야 함
      name: '관리자',
      createdAt: new Date().toISOString(),
      isAdmin: true,
      subscription: {
        tier: 'pro',
        status: 'active',
        startDate: new Date().toISOString(),
        aiRequestsUsed: 0,
        aiRequestsLimit: -1, // 무제한
      },
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }
  
  // 기존 관리자 계정에 Pro 구독이 없으면 추가
  const adminIndex = users.findIndex((u: StoredUser) => u.isAdmin);
  if (adminIndex !== -1 && !users[adminIndex].subscription) {
    users[adminIndex].subscription = {
      tier: 'pro',
      status: 'active',
      startDate: new Date().toISOString(),
      aiRequestsUsed: 0,
      aiRequestsLimit: -1, // 무제한
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }
  
  return users;
};

const saveUsers = (users: StoredUser[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // 최신 사용자 정보를 가져옴 (관리자 Pro 구독 자동 추가 포함)
        const users = getStoredUsers();
        const user = users.find((u) => u.email === email && u.password === password);

        if (user) {
          // 관리자이지만 Pro 구독이 없는 경우 추가
          if (user.isAdmin && (!user.subscription || user.subscription.tier !== 'pro' || user.subscription.aiRequestsLimit !== -1)) {
            user.subscription = {
              tier: 'pro',
              status: 'active',
              startDate: new Date().toISOString(),
              aiRequestsUsed: 0,
              aiRequestsLimit: -1, // 무제한
            };
            // 변경사항 저장
            const updatedUsers = users.map(u => u.id === user.id ? user : u);
            saveUsers(updatedUsers);
          }

          set({
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              createdAt: user.createdAt,
              isAdmin: user.isAdmin || false,
              profile: user.profile,
              subscription: user.subscription,
            },
            isAuthenticated: true,
          });
          return true;
        }
        return false;
      },

      register: async (email: string, password: string, name: string) => {
        const users = getStoredUsers();
        
        // 이미 존재하는 이메일 확인
        if (users.some((u) => u.email === email)) {
          return false;
        }

        // 무료 구독 기본 설정
        const freeSubscription: UserSubscription = {
          tier: 'free',
          status: 'active',
          startDate: new Date().toISOString(),
          aiRequestsUsed: 0,
          aiRequestsLimit: 5,
        };

        const newUser: StoredUser = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          email,
          password, // 실제로는 해시되어야 함
          name,
          createdAt: new Date().toISOString(),
          subscription: freeSubscription,
        };

        users.push(newUser);
        saveUsers(users);

        set({
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            createdAt: newUser.createdAt,
            subscription: freeSubscription,
          },
          isAuthenticated: true,
        });

        return true;
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      updateProfile: (name: string) => {
        const { user } = get();
        if (!user) return;

        const users = getStoredUsers();
        const updatedUsers = users.map((u) =>
          u.id === user.id ? { ...u, name } : u
        );
        saveUsers(updatedUsers);

        set({
          user: { ...user, name },
        });
      },

      updateHealthProfile: (profile: UserProfile) => {
        const { user } = get();
        if (!user) return;

        const users = getStoredUsers();
        const updatedUsers = users.map((u) =>
          u.id === user.id ? { ...u, profile } : u
        );
        saveUsers(updatedUsers);

        set({
          user: { ...user, profile },
        });
      },

      updateSubscription: (subscription: UserSubscription) => {
        const { user } = get();
        if (!user) return;

        const users = getStoredUsers();
        const updatedUsers = users.map((u) =>
          u.id === user.id ? { ...u, subscription } : u
        );
        saveUsers(updatedUsers);

        set({
          user: { ...user, subscription },
        });
      },

      upgradeToPremium: (tier: SubscriptionTier) => {
        const { user } = get();
        if (!user) return false;

        const aiRequestsLimit = tier === 'free' ? 5 : tier === 'premium' ? 100 : -1;
        
        const subscription: UserSubscription = {
          tier,
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: tier === 'free' ? undefined : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후
          aiRequestsUsed: 0,
          aiRequestsLimit,
        };

        const users = getStoredUsers();
        const updatedUsers = users.map((u) =>
          u.id === user.id ? { ...u, subscription } : u
        );
        saveUsers(updatedUsers);

        set({
          user: { ...user, subscription },
        });

        return true;
      },

      incrementAIUsage: () => {
        const { user } = get();
        if (!user || !user.subscription) return false;

        const { subscription } = user;
        
        // Pro는 무제한
        if (subscription.tier === 'pro') return true;
        
        // 사용 한도 확인
        const used = subscription.aiRequestsUsed || 0;
        const limit = subscription.aiRequestsLimit || 0;
        
        if (used >= limit) return false;

        const updatedSubscription = {
          ...subscription,
          aiRequestsUsed: used + 1,
        };

        const users = getStoredUsers();
        const updatedUsers = users.map((u) =>
          u.id === user.id ? { ...u, subscription: updatedSubscription } : u
        );
        saveUsers(updatedUsers);

        set({
          user: { ...user, subscription: updatedSubscription },
        });

        return true;
      },

      canUseAI: () => {
        const { user } = get();
        if (!user) return false;

        // 구독 정보가 없으면 무료 사용자 (기본 조언만)
        if (!user.subscription) return false;

        const { subscription } = user;

        // 만료 확인
        if (subscription.status !== 'active') return false;
        if (subscription.endDate && new Date(subscription.endDate) < new Date()) return false;

        // Pro는 무제한
        if (subscription.tier === 'pro') return true;

        // 사용 한도 확인
        const used = subscription.aiRequestsUsed || 0;
        const limit = subscription.aiRequestsLimit || 0;

        return used < limit;
      },

      getAllUsers: () => {
        return getStoredUsers();
      },

      deleteUser: (userId: string) => {
        const users = getStoredUsers();
        const user = users.find((u) => u.id === userId);
        
        // 관리자 계정은 삭제 불가
        if (user?.isAdmin) return false;
        
        const updatedUsers = users.filter((u) => u.id !== userId);
        saveUsers(updatedUsers);
        return true;
      },

      updateUserAdmin: (userId: string, isAdmin: boolean) => {
        const users = getStoredUsers();
        const updatedUsers = users.map((u) =>
          u.id === userId ? { ...u, isAdmin } : u
        );
        saveUsers(updatedUsers);
        return true;
      },

      updateUserSubscription: (userId: string, subscription: UserSubscription) => {
        const users = getStoredUsers();
        const updatedUsers = users.map((u) =>
          u.id === userId ? { ...u, subscription } : u
        );
        saveUsers(updatedUsers);
        
        // 현재 로그인한 사용자의 구독 정보도 업데이트
        const currentUser = get().user;
        if (currentUser && currentUser.id === userId) {
          set({ user: { ...currentUser, subscription } });
        }
        
        return true;
      },

      grantPremiumAccess: (userId: string, tier: SubscriptionTier, duration?: number) => {
        const users = getStoredUsers();
        const targetUser = users.find((u) => u.id === userId);
        
        if (!targetUser) return false;

        const now = new Date();
        const endDate = duration 
          ? new Date(now.getTime() + duration * 24 * 60 * 60 * 1000).toISOString()
          : undefined; // 무기한

        const tierLimits = {
          free: 5,
          premium: 100,
          pro: -1, // 무제한
        };

        const newSubscription: UserSubscription = {
          tier,
          status: 'active',
          startDate: now.toISOString(),
          endDate,
          aiRequestsUsed: 0,
          aiRequestsLimit: tierLimits[tier],
        };

        return get().updateUserSubscription(userId, newSubscription);
      },
    }),
    {
      name: 'health-auth',
    }
  )
);
