import { NotificationTableRow } from "@/utils/types";
import { create } from "zustand";

type Store = {
  notificationList: NotificationTableRow[];
  unreadNotificationCount: number;
  actions: {
    setNotificationList: (notifications: NotificationTableRow[]) => void;
    readNotification: (idList: string[]) => void;
    readAllNotifications: () => void;
    setUnreadNotification: (count: number) => void;
    reset: () => void;
  };
};

export const useNotificationStore = create<Store>((set) => ({
  notificationList: [],
  unreadNotificationCount: 0,
  actions: {
    setNotificationList(notifications) {
      set((state) => ({
        ...state,
        notificationList: notifications,
      }));
    },
    readNotification(idList) {
      set((state) => {
        const unreadSelectedCount = state.notificationList.filter(
          (notification) =>
            idList.includes(notification.notification_id) && !notification.notification_is_read,
        ).length;
        const newNotificationList = state.notificationList.map((notification) => {
          if (!idList.includes(notification.notification_id)) return notification;
          return {
            ...notification,
            notification_is_read: true,
          };
        });
        return {
          ...state,
          notificationList: newNotificationList,
          unreadNotificationCount: Math.max(state.unreadNotificationCount - unreadSelectedCount, 0),
        };
      });
    },
    readAllNotifications() {
      set((state) => ({
        ...state,
        notificationList: state.notificationList.map((notification) => ({
          ...notification,
          notification_is_read: true,
        })),
        unreadNotificationCount: 0,
      }));
    },
    setUnreadNotification(count) {
      set((state) => ({
        ...state,
        unreadNotificationCount: count,
      }));
    },
    reset() {
      set(() => ({
        notificationList: [],
        unreadNotificationCount: 0,
      }));
    },
  },
}));

export const useNotificationList = () => useNotificationStore((state) => state.notificationList);
export const useUnreadNotificationCount = () =>
  useNotificationStore((state) => state.unreadNotificationCount);
export const useNotificationActions = () => useNotificationStore((state) => state.actions);
