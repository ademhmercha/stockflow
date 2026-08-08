import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  // Détecté globalement par l'api-client (code ENTREPRISE_SUSPENDUE) dès la
  // première requête qui échoue pour cette raison, peu importe quelle page
  // l'a déclenchée — évite de dupliquer cette gestion dans chaque composant.
  suspendedMessage: string | null;
  setSession: (data: { user: User; accessToken: string; refreshToken: string }) => void;
  setAccessToken: (accessToken: string) => void;
  setSuspended: (message: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      suspendedMessage: null,
      setSession: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken, suspendedMessage: null }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setSuspended: (message) => set({ suspendedMessage: message }),
      clearSession: () => set({ user: null, accessToken: null, refreshToken: null, suspendedMessage: null }),
    }),
    { name: "stockflow-auth", partialize: (state) => ({ user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken }) }
  )
);

export function hasRole(role: User["role"] | undefined, ...allowed: User["role"][]): boolean {
  return !!role && allowed.includes(role);
}
