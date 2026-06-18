import { Database } from "./database";

export type ErrorTableRow = Database["public"]["Tables"]["error_table"]["Row"];
export type ErrorTableInsert = Database["public"]["Tables"]["error_table"]["Insert"];
export type ErrorTableUpdate = Database["public"]["Tables"]["error_table"]["Update"];

export type AttachmentTableRow = Database["public"]["Tables"]["attachment_table"]["Row"];
export type AttachmentTableInsert = Database["public"]["Tables"]["attachment_table"]["Insert"];
export type AttachmentTableUpdate = Database["public"]["Tables"]["attachment_table"]["Update"];

export type UserTableRow = Database["public"]["Tables"]["user_table"]["Row"];
export type UserTableInsert = Database["public"]["Tables"]["user_table"]["Insert"];
export type UserTableUpdate = Database["public"]["Tables"]["user_table"]["Update"];

export type AddressTableRow = Database["public"]["Tables"]["address_table"]["Row"];
export type DeliveryDetailTableRow = Database["public"]["Tables"]["delivery_detail_table"]["Row"];

export type MakeTableRow = Database["public"]["Tables"]["make_table"]["Row"];
export type MakeTableInsert = Database["public"]["Tables"]["make_table"]["Insert"];
export type MakeTableUpdate = Database["public"]["Tables"]["make_table"]["Update"];

export type ModelTableRow = Database["public"]["Tables"]["model_table"]["Row"];
export type ModelTableInsert = Database["public"]["Tables"]["model_table"]["Insert"];
export type ModelTableUpdate = Database["public"]["Tables"]["model_table"]["Update"];

export type MagicCollarTableRow = Database["public"]["Tables"]["magic_collar_table"]["Row"];
export type MagicCollarTableInsert = Database["public"]["Tables"]["magic_collar_table"]["Insert"];
export type MagicCollarTableUpdate = Database["public"]["Tables"]["magic_collar_table"]["Update"];

export type CarTableRow = Database["public"]["Tables"]["car_table"]["Row"];
export type CarTableInsert = Database["public"]["Tables"]["car_table"]["Insert"];
export type CarTableUpdate = Database["public"]["Tables"]["car_table"]["Update"];

export type BatchTableRow = Database["public"]["Tables"]["batch_table"]["Row"];
export type BatchTableInsert = Database["public"]["Tables"]["batch_table"]["Insert"];
export type BatchTableUpdate = Database["public"]["Tables"]["batch_table"]["Update"];

export type OrderTableRow = Database["public"]["Tables"]["order_table"]["Row"];
export type OrderTableInsert = Database["public"]["Tables"]["order_table"]["Insert"];
export type OrderTableUpdate = Database["public"]["Tables"]["order_table"]["Update"];

export type OrderItemTableRow = Database["public"]["Tables"]["order_item_table"]["Row"];
export type OrderItemTableInsert = Database["public"]["Tables"]["order_item_table"]["Insert"];
export type OrderItemTableUpdate = Database["public"]["Tables"]["order_item_table"]["Update"];

export type PickupAddressTableRow = Database["public"]["Tables"]["pickup_address_table"]["Row"];
export type PickupAddressTableInsert =
  Database["public"]["Tables"]["pickup_address_table"]["Insert"];
export type PickupAddressTableUpdate =
  Database["public"]["Tables"]["pickup_address_table"]["Update"];

export type PaymentTableRow = Database["public"]["Tables"]["payment_table"]["Row"];
export type PaymentTableInsert = Database["public"]["Tables"]["payment_table"]["Insert"];
export type PaymentTableUpdate = Database["public"]["Tables"]["payment_table"]["Update"];

export type CheckoutTableRow = Database["public"]["Tables"]["checkout_table"]["Row"];
export type CheckoutTableInsert = Database["public"]["Tables"]["checkout_table"]["Insert"];
export type CheckoutTableUpdate = Database["public"]["Tables"]["checkout_table"]["Update"];

export type OrderPaymentTableRow = Database["public"]["Tables"]["order_payment_table"]["Row"];
export type OrderPaymentTableInsert = Database["public"]["Tables"]["order_payment_table"]["Insert"];
export type OrderPaymentTableUpdate = Database["public"]["Tables"]["order_payment_table"]["Update"];

export type PaymentChannelTableRow = Database["public"]["Tables"]["payment_channel_table"]["Row"];
export type PaymentChannelTableInsert =
  Database["public"]["Tables"]["payment_channel_table"]["Insert"];
export type PaymentChannelTableUpdate =
  Database["public"]["Tables"]["payment_channel_table"]["Update"];

export type BatchStatusLogTableRow = Database["public"]["Tables"]["batch_status_log_table"]["Row"];
export type BatchStatusLogTableInsert =
  Database["public"]["Tables"]["batch_status_log_table"]["Insert"];
export type BatchStatusLogTableUpdate =
  Database["public"]["Tables"]["batch_status_log_table"]["Update"];

export type OrderStatusLogTableRow = Database["public"]["Tables"]["order_status_log_table"]["Row"];
export type OrderStatusLogTableInsert =
  Database["public"]["Tables"]["order_status_log_table"]["Insert"];
export type OrderStatusLogTableUpdate =
  Database["public"]["Tables"]["order_status_log_table"]["Update"];

export type OrderItemStatusLogTableRow =
  Database["public"]["Tables"]["order_item_status_log_table"]["Row"];
export type OrderItemStatusLogTableInsert =
  Database["public"]["Tables"]["order_item_status_log_table"]["Insert"];
export type OrderItemStatusLogTableUpdate =
  Database["public"]["Tables"]["order_item_status_log_table"]["Update"];

export type AttachmentBucketType = "CARS" | "USER_AVATARS" | "PAYMENT_PROOFS";

export type PaymentDescriptionEnum = Database["public"]["Enums"]["payment_description"];
export type OrderFulfillmentEnum = Database["public"]["Enums"]["order_fulfillment"];
export type OrderStatusEnum = Database["public"]["Enums"]["order_status"];
export type OrderItemStatusEnum = Database["public"]["Enums"]["order_item_status"];
export type OrderPaymentStatusEnum = Database["public"]["Enums"]["order_payment_status"];
export type BatchStatusEnum = Database["public"]["Enums"]["batch_status"];
export type OrderPaymentRequestStatusEnum =
  Database["public"]["Enums"]["order_payment_request_status"];

export type OptionType = {
  label: string;
  value: string;
};

export type CarShopType = CarTableRow & {
  car_make: string;
  car_model: string;
  car_magic_collar: MagicCollarTableRow;
  car_image_attachment: AttachmentTableRow;
};

export type OnboardingFormValuesType = {
  firstName: string;
  lastName: string;
  phone: string;
  addresses: OnboardingAddressType[];
};

export type OnboardingAddressType = {
  fullName: string;
  phone: string;
  region: string | null;
  regionOptions: OptionType[];
  province: string | null;
  provinceOptions: OptionType[];
  city: string | null;
  cityOptions: OptionType[];
  barangay: string | null;
  barangayOptions: (OptionType & { postalCode: string })[];
  street: string;
  postalCode: string;
  isDefault: boolean;
};

export type CheckoutAddressType = DeliveryDetailTableRow & {
  delivery_detail_address: AddressTableRow;
};

export type ShopFiltersType = {
  makeId: string;
  modelId: string;
  yearStart: string;
  yearEnd: string;
  sortBy: string;
};

export type CartItemType = {
  product: CarShopType;
  quantity: number;
};

export type StoredCartItemType = {
  carId: string;
  quantity: number;
};

export type PaymentMethodType = "qrph" | "shopee_pay" | "paymaya" | "grab_pay" | "gcash";

export type CreateCheckoutReqType = {
  paymentMethod: PaymentMethodType;
  orderData: {
    fulfillmentType: string;
    selectedAddressId: string;
    items: { id: string; quantity: number }[];
  };
  description: PaymentDescriptionEnum;
  userId: string;
  userEmail: string;
};

export type CheckoutSummaryType = {
  itemCount: number;
  downPayment: number;
  total: number;
  fulfillmentType: OrderFulfillmentEnum;
  courier: string;
  paymentMethod: PaymentMethodType;
  currency: string;
};

export type CustomerPaymentChannel = PaymentChannelTableRow & {
  payment_channel_qr_code_attachment: AttachmentTableRow | null;
};

export type StatusMetadata<TStatus extends string> = Record<
  TStatus,
  {
    color: string;
    description: string;
  }
>;

export type OrderWithOrderItemType = OrderTableRow & {
  order_item: (OrderItemTableRow & {
    order_item_car_image_attachment: AttachmentTableRow;
    order_item_batch: BatchTableRow | null;
  })[];
};

export type PaymentChannelType = PaymentChannelTableRow & {
  payment_channel_qr_code_attachment: AttachmentTableRow;
};

export type OrderPaymentType = OrderPaymentTableRow & {
  order_payment_proof_attachment: AttachmentTableRow;
  order_payment_payment_channel: PaymentChannelTableRow;
};
