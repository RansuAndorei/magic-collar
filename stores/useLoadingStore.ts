import { create } from "zustand";

type Store = {
  isLoading: boolean;
  actions: {
    setIsLoading: (value: boolean) => void;
  };
};

export const useLoadingStore = create<Store>((set) => ({
  isLoading: false,
  actions: {
    setIsLoading(value) {
      set((state) => ({
        ...state,
        isLoading: value,
      }));
    },
  },
}));

export const useIsLoading = () => useLoadingStore((state) => state.isLoading);
export const useLoadingActions = () => useLoadingStore((state) => state.actions);
