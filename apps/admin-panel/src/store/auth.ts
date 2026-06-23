/**
 * Auth store — Zustand
 *
 * Manages admin session state with persistence across page refresh.
 * Both token and admin profile are stored in cookies (see `lib/apollo.ts`).
 */
import { create } from 'zustand';
import {
  clearAdminToken,
  getAdminToken,
  getAdminProfile,
  saveAdminToken,
  saveAdminProfile,
  type AdminProfile,
} from '@/lib/apollo';

interface AuthState {
  admin: AdminProfile | null;
  isAuthenticated: boolean;
  hydrated: boolean; // becomes true after first initialize() call
  setAdmin: (admin: AdminProfile, token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  isAuthenticated: false,
  hydrated: false,

  setAdmin(admin, token) {
    saveAdminToken(token);
    saveAdminProfile(admin);
    set({ admin, isAuthenticated: true, hydrated: true });
  },

  logout() {
    clearAdminToken();
    set({ admin: null, isAuthenticated: false });
  },

  /** Restore session from cookies on app boot */
  initialize() {
    const token = getAdminToken();
    const profile = getAdminProfile();
    if (token && profile) {
      set({ admin: profile, isAuthenticated: true, hydrated: true });
    } else {
      // Token without profile (or vice versa) = corrupted state → clear
      if (token || profile) clearAdminToken();
      set({ admin: null, isAuthenticated: false, hydrated: true });
    }
  },
}));
