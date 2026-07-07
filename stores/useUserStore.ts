import { UserTableRow } from "@/utils/types";
import { User } from "@supabase/supabase-js";
import { create } from "zustand";

type Store = {
  userData: User | null;
  userProfile: UserTableRow | null;
  isLoading: boolean;
  hasInitialized: boolean;
  actions: {
    setUserProfile: (profile: UserTableRow | null) => void;
    setUserData: (user: User | null) => void;
    setIsLoading: (value: boolean) => void;
    setHasInitialized: (value: boolean) => void;
    reset: () => void;
  };
};

export const useUserStore = create<Store>((set) => ({
  userData: null,
  userProfile: null,
  isLoading: true,
  hasInitialized: false,
  actions: {
    setUserProfile(profile) {
      set((state) => ({
        ...state,
        userProfile: profile,
      }));
    },
    setUserData(user) {
      set((state) => ({
        ...state,
        userData: user,
      }));
    },
    setIsLoading(isLoading) {
      set((state) => ({
        ...state,
        isLoading: isLoading,
      }));
    },
    setHasInitialized(hasInitialized) {
      set((state) => ({
        ...state,
        hasInitialized: hasInitialized,
      }));
    },
    reset() {
      set(() => ({
        userData: null,
        userProfile: null,
        isLoading: false,
      }));
    },
  },
}));

export const useUserActions = () => useUserStore((state) => state.actions);
export const useUserProfile = () => useUserStore((state) => state.userProfile);
export const useUserData = () => useUserStore((state) => state.userData);
export const useUserIsLoading = () => useUserStore((state) => state.isLoading);
export const useUserHasInitialized = () => useUserStore((state) => state.hasInitialized);
