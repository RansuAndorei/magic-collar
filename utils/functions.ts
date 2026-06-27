import { IconCircleCheck, IconCircleX, IconClock } from "@tabler/icons-react";
import {
  BATCH_STATUS_METADATA,
  MAX_QUANTITY,
  ORDER_ITEM_STATUS_METADATA,
  ORDER_STATUS_METADATA,
  PAYMENT_STATUS_METADATA,
  PAYMONGO_PAYMENT_DATA,
} from "./constants";
import {
  BatchStatusEnum,
  OrderItemStatusEnum,
  OrderPaymentRequestStatusEnum,
  OrderPaymentStatusEnum,
  OrderStatusEnum,
  OrderWithOrderItemType,
  PaymentMethodType,
  StoredCartItemType,
} from "./types";

export const isAppError = (e: unknown): e is { message: string } =>
  typeof e === "object" && e !== null && "message" in e;

export const parseStoredCart = (value: string | null): StoredCartItemType[] => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item): StoredCartItemType | null => {
        if (!item || typeof item !== "object") return null;

        const carId = "carId" in item && typeof item.carId === "string" ? item.carId : "";
        const quantity =
          "quantity" in item && typeof item.quantity === "number"
            ? Math.min(MAX_QUANTITY, Math.max(1, Math.floor(item.quantity)))
            : 1;

        return carId ? { carId, quantity } : null;
      })
      .filter((item): item is StoredCartItemType => item !== null);
  } catch {
    return [];
  }
};

export const formatCurrency = (
  amount: number,
  options: {
    locale?: string;
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
  } = {},
) => {
  const {
    locale = "en-PH",
    currency = "PHP",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSymbol = true,
  } = options;

  if (typeof amount !== "number" || isNaN(amount)) return "";

  return new Intl.NumberFormat(locale, {
    style: showSymbol ? "currency" : "decimal",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
};

export const feeCalculator = (total: number, paymentMethod: PaymentMethodType) => {
  const rate = PAYMONGO_PAYMENT_DATA[paymentMethod].fee;
  const net = total;
  const baseGross = net / (1 - rate);
  const round2 = (x: number) => Math.round(x * 100) / 100;
  let gross = round2(baseGross);
  const fee = round2(gross * rate);
  const computedNet = round2(gross - fee);
  if (computedNet !== net) {
    gross = round2(gross + (net - computedNet));
  }
  const transferFee = round2(gross * rate);
  const totalAmount = gross;

  return {
    transferFee,
    totalAmount,
  };
};

export const formatPhilippineMobileNumber = (phoneNumber: string) =>
  `+63 ${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6)}`;

export const getProductTitle = (make: string, model: string) => `Magic Collar for ${make} ${model}`;

export const getProductSubtitle = (modelCode: string, yearStart: number, yearEnd: number | null) =>
  [modelCode, getYearRange(yearStart, yearEnd)].filter(Boolean).join(" / ");

export const getYearRange = (yearStart: number, yearEnd: number | null) =>
  yearEnd ? `${yearStart}-${yearEnd}` : `${yearStart}-present`;

export const getSetContents = (
  frontQuantity: number | null,
  rearQuantity: number | null,
  allQuantity: number | null,
) => {
  const parts: string[] = [];

  if (frontQuantity !== null) {
    parts.push(`${frontQuantity} front`);
  }
  if (rearQuantity !== null) {
    parts.push(`${rearQuantity} rear`);
  }
  if (allQuantity !== null) {
    parts.push(`${allQuantity} all`);
  }

  return parts.length > 0 ? parts.join(" / ") : "Set details unavailable";
};

export const getOrderTotal = (itemList: OrderWithOrderItemType["order_item"]) =>
  itemList.reduce((total, item) => total + item.order_item_price * item.order_item_quantity, 0);

export const getOrderStatusColor = (status: OrderStatusEnum) =>
  ORDER_STATUS_METADATA[status]?.color ?? "gray";

export const getOrderItemStatusColor = (status: OrderItemStatusEnum) =>
  ORDER_ITEM_STATUS_METADATA[status]?.color ?? "gray";

export const getPaymentStatusColor = (status: OrderPaymentStatusEnum) =>
  PAYMENT_STATUS_METADATA[status]?.color ?? "gray";

export const getBatchStatusColor = (status: BatchStatusEnum) =>
  BATCH_STATUS_METADATA[status]?.color ?? "gray";

export const getOrderStatusDescription = (status: OrderStatusEnum) =>
  ORDER_STATUS_METADATA[status]?.description ?? "";

export const getOrderItemStatusDescription = (status: OrderItemStatusEnum) =>
  ORDER_ITEM_STATUS_METADATA[status]?.description ?? "";

export const getPaymentStatusDescription = (status: OrderPaymentStatusEnum) =>
  PAYMENT_STATUS_METADATA[status]?.description ?? "";

export const getBatchStatusDescription = (status: BatchStatusEnum) =>
  BATCH_STATUS_METADATA[status]?.description ?? "";

export const formatStatusLabel = (status: string) => status.replace(/_/g, " ");

export const getStatusConfig = (status: OrderPaymentRequestStatusEnum) => {
  const accentColor =
    {
      APPROVED: "#1D9E75",
      PENDING: "#EF9F27",
      REJECTED: "#E24B4A",
    }[status] ?? "#888780";

  const badgeStyle = {
    APPROVED: { bg: "#E1F5EE", color: "#0F6E56" },
    PENDING: { bg: "rgb(250, 238, 218)", color: "#854F0B" },
    REJECTED: { bg: "#FCEBEB", color: "#A32D2D" },
  }[status] ?? { bg: "#F1EFE8", color: "#5F5E5A" };

  const statusIcon = {
    APPROVED: IconCircleCheck,
    PENDING: IconClock,
    REJECTED: IconCircleX,
  }[status];

  return {
    accentColor,
    badgeStyle,
    statusIcon,
  };
};

export const formatDate = (date: Date) =>
  date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

export const generateAvatarColor = (userId: string | number): string => {
  const str = String(userId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
};

export const getAvailabilityProps = (isAvailable: boolean) =>
  isAvailable
    ? {
        label: "Available",
        color: "green",
      }
    : {
        label: "Unavailable",
        color: "orange",
      };

export const urlToFile = async (url: string, filename: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, {
    type: blob.type,
  });
};

export const parseStatus = (value: string | null) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};

export type LoadingRowType = { id: string; action: "edit" | "disable" | "delete" } | null;
