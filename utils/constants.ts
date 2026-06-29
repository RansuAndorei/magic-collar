import {
  IconAlertTriangle,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandYoutube,
  IconCar,
  IconCash,
  IconChartBar,
  IconCircleCheck,
  IconClipboardList,
  IconClockHour4,
  IconHeadset,
  IconMail,
  IconMapPin,
  IconMessageCircle,
  IconPackage,
  IconPackageExport,
  IconPhone,
  IconPhotoScan,
  IconSettings2,
  IconShieldCheck,
  IconShip,
  IconShoppingBag,
  IconShoppingCartCheck,
  IconTag,
  IconTruck,
  IconTruckDelivery,
  IconX,
} from "@tabler/icons-react";
import {
  BatchStatusEnum,
  OrderItemStatusEnum,
  OrderPaymentStatusEnum,
  OrderStatusEnum,
  StatusMetadata,
} from "./types";

export const LOGO_PATH = "/images/logo.svg";

export const NAV_LINKS = [
  { label: "Brands", href: "/#brands" },
  { label: "Products", href: "/#products" },
  { label: "Why Us", href: "/#why-us" },
  { label: "Contact", href: "/#contact" },
];

export const CAR_BRANDS = [
  { name: "Honda", country: "Japan" },
  { name: "Nissan", country: "Japan" },
  { name: "Tesla", country: "USA" },
  { name: "Mitsubishi", country: "Japan" },
  { name: "Mazda", country: "Japan" },
  { name: "Ford", country: "USA" },
  { name: "Toyota", country: "Japan" },
  { name: "Subaru", country: "Japan" },
  { name: "Suzuki", country: "Japan" },
  { name: "Hyundai", country: "Korea" },
  { name: "Kia", country: "Korea" },
  { name: "Volkswagen", country: "Germany" },
  { name: "Audi", country: "Germany" },
  { name: "Porsche", country: "Germany" },
  { name: "BMW", country: "Germany" },
  { name: "Mini Cooper", country: "UK" },
  { name: "Mercedes-Benz", country: "Germany" },
  { name: "Isuzu", country: "Japan" },
];

export const FEATURED_PRODUCTS = [
  {
    name: "Magic Collar — Honda Civic",
    model: "Honda Civic (2016–2023)",
    sku: "MC-HON-CIV-001",
    price: "₱3,499",
    oldPrice: "₱4,200",
    badge: "Best Seller",
    badgeColor: "red",
    rating: 4.9,
    reviews: 312,
  },
  {
    name: "Magic Collar — Toyota Fortuner",
    model: "Toyota Fortuner (2016–2024)",
    sku: "MC-TOY-FOR-001",
    price: "₱3,899",
    oldPrice: null,
    badge: "New",
    badgeColor: "red",
    rating: 4.8,
    reviews: 87,
  },
  {
    name: "Magic Collar — Mitsubishi Montero",
    model: "Mitsubishi Montero Sport (2017–2024)",
    sku: "MC-MIT-MON-001",
    price: "₱3,699",
    oldPrice: "₱4,500",
    badge: "Sale",
    badgeColor: "red",
    rating: 4.7,
    reviews: 145,
  },
  {
    name: "Magic Collar — Ford Ranger",
    model: "Ford Ranger (2015–2023)",
    sku: "MC-FOR-RNG-001",
    price: "₱3,599",
    oldPrice: null,
    badge: "Top Rated",
    badgeColor: "red",
    rating: 4.9,
    reviews: 210,
  },
];

export const PERKS = [
  {
    icon: IconShieldCheck,
    label: "Genuine Parts",
    description: "Every Magic Collar is authentic and tested to fit your specific make and model.",
  },
  {
    icon: IconTruckDelivery,
    label: "Nationwide Delivery",
    description: "We ship to all provinces and cities across the Philippines, fast and insured.",
  },
  {
    icon: IconTag,
    label: "Competitive Pricing",
    description: "Get the best value for quality parts — no hidden fees, no markups.",
  },
  {
    icon: IconSettings2,
    label: "Guaranteed Fit",
    description: "Wrong fitment? We'll replace it or refund you. No questions asked.",
  },
  {
    icon: IconHeadset,
    label: "Expert Support",
    description: "Our team knows cars. Reach us via phone, email, or Messenger anytime.",
  },
  {
    icon: IconPackage,
    label: "Secure Packaging",
    description: "Parts are bubble-wrapped and boxed to arrive in perfect condition every time.",
  },
];

export const TESTIMONIALS = [
  {
    name: "Carlo Reyes",
    location: "Manila",
    type: "Retail Buyer",
    text: "Fitted it on my Civic and the difference was night and day. Magic Collar delivers exactly what it promises.",
    rating: 5,
  },
  {
    name: "Diane Santos",
    location: "Cebu",
    type: "Reseller",
    text: "I've been reselling Magic Collar for 2 years. My customers love the quality and the wholesale margins are great.",
    rating: 5,
  },
  {
    name: "Mark Villanueva",
    location: "Davao",
    type: "Retail Buyer",
    text: "Got one for my Fortuner. Delivered in 2 days, fits perfectly. Best purchase I've made for my truck.",
    rating: 5,
  },
];

export const FOOTER_LINKS = {
  Products: [
    {
      label: "Honda",
      link: "/shop/?make=Honda",
    },
    {
      label: "Toyota",
      link: "/shop/?make=Toyota",
    },
    {
      label: "Mitsubishi",
      link: "/shop/?make=Mitsubishi",
    },
    {
      label: "View All Brands",
      link: "/shop",
    },
  ],
  Support: [
    {
      label: "FAQs",
      link: "faq",
    },
    {
      label: "Track Order",
      link: "track-order",
    },
    {
      label: "Contact Us",
      link: "#contact",
    },
  ],
  Policies: [
    {
      label: "Shipping Policy",
      link: "shipping-policy",
    },
    {
      label: "Privacy Policy",
      link: "privacy-policy",
    },
    {
      label: "Terms of Service",
      link: "terms-of-service",
    },
  ],
};

export const SOCIAL_LINKS = [
  { icon: IconBrandFacebook, label: "Facebook", color: "#1877F2" },
  { icon: IconBrandInstagram, label: "Instagram", color: "#E1306C" },
  { icon: IconBrandYoutube, label: "YouTube", color: "#FF0000" },
  { icon: IconBrandTiktok, label: "TikTok", color: "#00c2bb" },
];

export const SKIPPED_ERROR_MESSAGES = ["Email already registered."];

export const TEXT_LIMITS = {
  short: 50, // names, labels
  medium: 100, // email, phone, usernames
  long: 255, // addresses, titles
  text: 1000, // messages, notes
} as const;

export const FETCH_OPTION_LIMIT = 1000;
export const SHOP_PAGE_SIZE = 12;
export const ORDER_PAGE_SIZE = 5;
export const MAX_QUANTITY = 1000;
export const ORDER_INITIAL_VISIBLE = 3;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const PAGINATION_OPTIONS = [10, 20, 50];

export const SHOP_PREFERENCES_STORAGE_KEY = "magic-collar-shop-preferences";
export const ORDER_PREFERENCES_STORAGE_KEY = "magic-collar-order-preferences";
export const SHOP_CART_STORAGE_KEY = "magic-collar-shop-cart";
export const CHECKOUT_SUMMARY_STORAGE_KEY = "magic-collar-checkout-summary";
export const CHECKOUT_ID_STORAGE_KEY = "magic-collar-checkout-id";

export const YEAR_OPTIONS = Array.from({ length: 35 }, (_, i) => {
  const year = String(new Date().getFullYear() - i);
  return { value: year, label: year };
});

export const SHOP_SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "make_asc", label: "Make: A–Z" },
];

export const PAYMONGO_PAYMENT_DATA = {
  qrph: {
    label: "QRPh",
    fee: 0.015,
  },
  shopee_pay: {
    label: "ShopeePay",
    fee: 0.019,
  },
  paymaya: {
    label: "Maya",
    fee: 0.02,
  },
  grab_pay: {
    label: "GrabPay",
    fee: 0.022,
  },
  gcash: {
    label: "GCash",
    fee: 0.025,
  },
};

export const ORDER_STATUS_METADATA: StatusMetadata<OrderStatusEnum> = {
  PENDING: {
    color: "yellow",
    description: "The order is being processed and prepared for fulfillment.",
    icon: IconClockHour4,
  },
  "FOR DELIVERY": {
    color: "blue",
    description: "The order has been dispatched and is on its way to the customer.",
    icon: IconTruckDelivery,
  },
  DELIVERED: {
    color: "green",
    description: "The order has been successfully delivered to the customer.",
    icon: IconCircleCheck,
  },
  FORFEITED: {
    color: "red",
    description:
      "The order was not fully paid within the required period and has been forfeited. Any down payment made is non-refundable.",
    icon: IconAlertTriangle,
  },
  CANCELLED: {
    color: "gray",
    description: "The order has been cancelled and will not proceed.",
    icon: IconX,
  },
};

export const ORDER_ITEM_STATUS_METADATA: StatusMetadata<OrderItemStatusEnum> = {
  PENDING: {
    color: "yellow",
    description: "The order is being processed and prepared for fulfillment.",
    icon: IconClockHour4,
  },
  "IN STOCK": {
    color: "teal",
    description:
      "The item is available in stock and reserved for this order. It is ready to proceed to delivery once all requirements, including payment, have been completed.",
    icon: IconPackage,
  },
  "FOR DELIVERY": {
    color: "blue",
    description: "The order has been dispatched and is on its way to the customer.",
    icon: IconTruckDelivery,
  },
  DELIVERED: {
    color: "green",
    description: "The order has been successfully delivered to the customer.",
    icon: IconCircleCheck,
  },
  FORFEITED: {
    color: "red",
    description:
      "The order was not fully paid within the required period and has been forfeited. Any down payment made is non-refundable.",
    icon: IconAlertTriangle,
  },
  CANCELLED: {
    color: "gray",
    description: "The item has been cancelled and will not proceed.",
    icon: IconX,
  },
};

export const PAYMENT_STATUS_METADATA: StatusMetadata<OrderPaymentStatusEnum> = {
  PENDING: {
    color: "yellow",
    description:
      "Payment has not been completed yet. If the order becomes ready for delivery while payment remains unpaid, delivery will be put on hold until payment is received.",
    icon: IconClockHour4,
  },
  PARTIALLY_PAID: {
    color: "orange",
    description:
      "A partial payment has been received for this order. If the order becomes ready for delivery and the remaining balance is still unpaid, delivery will be put on hold until full payment is completed.",
    icon: IconCash,
  },
  PAID: {
    color: "green",
    description: "This order has been fully paid.",
    icon: IconCircleCheck,
  },
  OVERDUE: {
    color: "red",
    description:
      "Payment is past the required due date. The payment deadline is 30 days from the date the order is marked for delivery.",
    icon: IconAlertTriangle,
  },
};

export const BATCH_STATUS_METADATA: StatusMetadata<BatchStatusEnum> = {
  PENDING: {
    color: "yellow",
    description:
      "Waiting for the batch to reach the required quantity before placing an order with the supplier.",
    icon: IconClockHour4,
  },
  "READY FOR ORDER": {
    color: "grape",
    description:
      "The batch has reached the required quantity and is ready to be ordered from the supplier.",
    icon: IconShoppingCartCheck,
  },
  ORDERED: {
    color: "blue",
    description: "The batch order has been placed with the supplier.",
    icon: IconTruck,
  },
  ENROUTE: {
    color: "cyan",
    description: "The batch is currently being shipped to the Philippines.",
    icon: IconShip,
  },
  "CUSTOMS CLEARANCE": {
    color: "orange",
    description: "The batch is being processed by customs authorities.",
    icon: IconPackageExport,
  },
  "READY FOR SHIPPING": {
    color: "green",
    description: "The batch has arrived and orders are ready to be shipped to customers.",
    icon: IconPackage,
  },
  CANCELLED: {
    color: "red",
    description: "The batch has been cancelled and will not proceed.",
    icon: IconX,
  },
};

export const ORDER_STATUS_OPTIONS: { value: OrderStatusEnum | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "FOR DELIVERY", label: "For Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "FORFEITED", label: "Forfeited" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const PAYMENT_STATUS_OPTIONS: { value: OrderPaymentStatusEnum | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
];

export const FULFILLMENT_OPTIONS = [
  { value: "ALL", label: "All fulfillment" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "PICKUP", label: "Pickup" },
];

export const BATCH_STATUS_OPTIONS: { value: BatchStatusEnum | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "READY FOR ORDER", label: "Ready For Order" },
  { value: "ORDERED", label: "Ordered" },
  { value: "ENROUTE", label: "Enroute" },
  { value: "CUSTOMS CLEARANCE", label: "Customs Clearance" },
  { value: "READY FOR SHIPPING", label: "Ready For Shipping" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const ADMIN_NAV_GROUP = [
  {
    label: "Overview",
    links: [
      {
        label: "Analytics",
        icon: IconChartBar,
        meta: "Sales, demand, batch timing",
        href: "/admin/analytics",
      },
    ],
  },
  {
    label: "Catalog",
    links: [
      {
        label: "Cars & Magic Collars",
        icon: IconCar,
        meta: "Fitment and collar records",
        href: "/admin/cars-magic-collars",
      },
    ],
  },
  {
    label: "Fulfillment",
    links: [
      {
        label: "Orders",
        icon: IconShoppingBag,
        meta: "List of orders and items",
        href: "/admin/orders",
      },
      {
        label: "Payment Proofs",
        icon: IconPhotoScan,
        meta: "Approve or reject uploads",
        href: "/admin/payment-proofs",
      },
      {
        label: "Batches",
        icon: IconClipboardList,
        meta: "Batch status updates",
        href: "/admin/batches",
      },
      { label: "Delivery Details", icon: IconTruckDelivery, meta: "Couriers and pickup addresses" },
    ],
  },
  {
    label: "Business",
    links: [
      { label: "Pickup Addresses", icon: IconMapPin, meta: "Branch and pickup list" },
      { label: "Email", icon: IconMail, meta: "Support inboxes" },
      { label: "Phone", icon: IconPhone, meta: "Published numbers" },
      { label: "Messenger", icon: IconMessageCircle, meta: "Chat channels" },
    ],
  },
];

export const STATUS_OPTIONS = [
  { value: "null", label: "All statuses" },
  { value: "true", label: "Available" },
  { value: "false", label: "Unavailable" },
];

export const BATCH_NEXT_STATUS: Partial<Record<BatchStatusEnum, BatchStatusEnum>> = {
  "READY FOR ORDER": "ORDERED",
  ORDERED: "ENROUTE",
  ENROUTE: "CUSTOMS CLEARANCE",
  "CUSTOMS CLEARANCE": "READY FOR SHIPPING",
};

export const REASON_FOR_REJECTION_OPTION = [
  "Blurry or unreadable receipt",
  "Receipt is cropped or incomplete",
  "Important details are missing",
  "Reference number does not match our records",
  "Incorrect payment recipient/account",
  "Duplicate payment proof submitted",
  "Wrong receipt uploaded",
  "Screenshot is not a payment confirmation",
  "Payment could not be verified",
  "Other",
];
