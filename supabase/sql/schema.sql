DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public AUTHORIZATION postgres;

DROP POLICY IF EXISTS objects_policy ON storage.objects;
DROP POLICY IF EXISTS buckets_policy ON storage.buckets;

DELETE FROM storage.objects;
DELETE FROM storage.buckets;

CREATE POLICY objects_policy ON storage.objects FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY buckets_policy ON storage.buckets FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

INSERT INTO storage.buckets(id, name) VALUES ('CARS', 'CARS');
INSERT INTO storage.buckets(id, name) VALUES ('USER_AVATARS', 'USER_AVATARS');
INSERT INTO storage.buckets(id, name) VALUES ('PAYMENT_PROOFS', 'PAYMENT_PROOFS');
INSERT INTO storage.buckets(id, name) VALUES ('PAYMENT_CHANNEL_QR', 'PAYMENT_CHANNEL_QR');

UPDATE storage.buckets SET public = true;

CREATE TYPE user_role AS ENUM(
  'ADMIN',
  'CUSTOMER'
);

CREATE TYPE batch_status AS ENUM(
  'PENDING',
  'READY FOR ORDER',
  'ORDERED',
  'ENROUTE',
  'CUSTOMS CLEARANCE',
  'READY FOR SHIPPING',
  'CANCELLED'
);

CREATE TYPE order_status AS ENUM (
  'PENDING',
  'FOR DELIVERY',
  'READY FOR PICKUP',
  'DELIVERED',
  'FORFEITED',
  'CANCELLED'
);

CREATE TYPE order_item_status AS ENUM (
  'PENDING',
  'IN STOCK',
  'FOR DELIVERY',
  'READY FOR PICKUP',
  'DELIVERED',
  'FORFEITED',
  'CANCELLED'
);

CREATE TYPE payment_status AS ENUM(
  'PENDING',
  'PAID',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE order_fulfillment AS ENUM(
  'DELIVERY',
  'PICKUP'
);

CREATE TYPE payment_description AS ENUM(
  'DOWNPAYMENT',
  'PAYMENT'
);

CREATE TYPE settings AS ENUM (
  'BATCH_LIMIT',
  'EMAIL',
  'PHONE_NUMBER',
  'MESSENGER',
  'FACEBOOK',
  'TIKTOK',
  'YOUTUBE',
  'INSTAGRAM'
);

CREATE TYPE order_payment_status AS ENUM (
  'PENDING',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE'
);

CREATE TYPE order_payment_request_status AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

CREATE SEQUENCE magic_collar_number_seq START 1000;
CREATE SEQUENCE order_number_seq START 1000;
CREATE SEQUENCE batch_number_seq START 1000;

CREATE TABLE attachment_table(
  attachment_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  attachment_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  attachment_is_disabled BOOLEAN DEFAULT false NOT NULL,

  attachment_name TEXT NOT NULL,
  attachment_path TEXT NOT NULL,
  attachment_bucket TEXT NOT NULL,
  attachment_mime_type TEXT,
  attachment_size BIGINT,

  UNIQUE (attachment_bucket, attachment_path)
);

CREATE TABLE user_table(
  user_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  user_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_first_name TEXT NOT NULL,
  user_last_name TEXT NOT NULL,
  user_email TEXT UNIQUE NOT NULL,
  user_is_disabled BOOLEAN DEFAULT false NOT NULL,
  user_phone_number TEXT NOT NULL,
  user_avatar TEXT,
  user_role user_role DEFAULT 'CUSTOMER' NOT NULL,
  user_is_authenticated BOOLEAN DEFAULT true NOT NULL
);

CREATE TABLE error_table(
  error_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  error_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  error_message TEXT NOT NULL,
  error_url TEXT NOT NULL,
  error_function TEXT NOT NULL,
  error_user_email TEXT,

  error_user_id uuid REFERENCES user_table(user_id) ON DELETE CASCADE
);

CREATE TABLE email_resend_table(
  email_resend_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  email_resend_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  email_resend_email TEXT NOT NULL
);

CREATE TABLE address_table(
  address_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  address_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  address_region TEXT NOT NULL,
  address_province TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_barangay TEXT NOT NULL,
  address_street TEXT NOT NULL,
  address_postal_code TEXT NOT NULL
);

CREATE TABLE delivery_detail_table(
  delivery_detail_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  delivery_detail_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  delivery_detail_is_disabled BOOLEAN DEFAULT false NOT NULL,
  delivery_detail_full_name TEXT NOT NULL,
  delivery_detail_phone_number TEXT NOT NULL,
  delivery_detail_is_default BOOLEAN NOT NULL,

  delivery_detail_address_id UUID REFERENCES address_table(address_id) NOT NULL,
  delivery_detail_user_id UUID REFERENCES user_table(user_id) NOT NULL
);

CREATE TABLE region_table(
  region_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  region TEXT NOT NULL,
  region_is_disabled BOOLEAN DEFAULT false NOT NULL,
  region_is_available BOOLEAN DEFAULT true NOT NULL
);

CREATE TABLE province_table(
  province_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  province TEXT NOT NULL,
  province_is_disabled BOOLEAN DEFAULT false NOT NULL,
  province_is_available BOOLEAN DEFAULT true NOT NULL,

  province_region_id UUID REFERENCES region_table(region_id) NOT NULL
);

CREATE TABLE city_table(
  city_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  city TEXT NOT NULL,
  city_is_disabled BOOLEAN DEFAULT false NOT NULL,
  city_is_available BOOLEAN DEFAULT true NOT NULL,

  city_province_id UUID REFERENCES province_table(province_id) NOT NULL
);

CREATE TABLE barangay_table(
  barangay_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  barangay TEXT NOT NULL,
  barangay_postal_code TEXT NOT NULL,
  barangay_is_disabled BOOLEAN DEFAULT false NOT NULL,
  barangay_is_available BOOLEAN DEFAULT true NOT NULL,

  barangay_city_id UUID REFERENCES city_table(city_id) NOT NULL
);

CREATE TABLE make_table(
  make_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  make_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  make VARCHAR(4000) UNIQUE NOT NULL,
  make_is_disabled BOOLEAN DEFAULT false NOT NULL,
  make_is_available BOOLEAN DEFAULT true NOT NULL
);

CREATE TABLE model_table(
  model_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  model_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  model VARCHAR(4000) NOT NULL,
  model_is_disabled BOOLEAN DEFAULT false NOT NULL,
  model_is_available BOOLEAN DEFAULT true NOT NULL,

  model_make_id UUID REFERENCES make_table(make_id) NOT NULL,
  UNIQUE(model_make_id, model)
);

CREATE TABLE magic_collar_table(
  magic_collar_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  magic_collar_reference_number INT DEFAULT nextval('order_number_seq') UNIQUE NOT NULL,
  magic_collar_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  magic_collar_date_updated TIMESTAMPTZ,
  magic_collar_is_disabled BOOLEAN DEFAULT false NOT NULL,
  magic_collar_is_available BOOLEAN DEFAULT true NOT NULL,

  magic_collar_price NUMERIC(10, 2) NOT NULL,
  magic_collar_price_currency TEXT DEFAULT 'PHP' NOT NULL,
  magic_collar_down_payment_price NUMERIC(10, 2) NOT NULL,
  magic_collar_front_quantity INT,
  magic_collar_rear_quantity INT,
  magic_collar_all_quantity INT,
  magic_collar_stock_quantity INT DEFAULT 0 NOT NULL,

  magic_collar_created_by_admin_user_id UUID REFERENCES user_table(user_id) NOT NULL,
  magic_collar_updated_by_admin_user_id UUID REFERENCES user_table(user_id),
  
  CONSTRAINT magic_collar_price_check CHECK (magic_collar_price >= 0),
  CONSTRAINT magic_collar_down_payment_price_check CHECK (
    magic_collar_down_payment_price >= 0
  ),
  CONSTRAINT magic_collar_front_quantity_check CHECK (
    magic_collar_front_quantity IS NULL OR magic_collar_front_quantity >= 0
  ),
  CONSTRAINT magic_collar_down_payment_not_more_than_price_check CHECK (
    magic_collar_down_payment_price <= magic_collar_price
  ),
  CONSTRAINT magic_collar_rear_quantity_check CHECK (
    magic_collar_rear_quantity IS NULL OR magic_collar_rear_quantity >= 0
  ),
  CONSTRAINT magic_collar_all_quantity_check CHECK (
    magic_collar_all_quantity IS NULL OR magic_collar_all_quantity >= 0
  ),
  CONSTRAINT magic_collar_quantity_check CHECK (
    magic_collar_front_quantity IS NOT NULL
    OR magic_collar_rear_quantity IS NOT NULL
    OR magic_collar_all_quantity IS NOT NULL
  )
);

CREATE TABLE car_table(
  car_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  car_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  car_date_updated TIMESTAMPTZ,
  car_is_disabled BOOLEAN DEFAULT false NOT NULL,
  car_is_available BOOLEAN DEFAULT true NOT NULL,

  car_model_code TEXT,
  car_model_year_start INT NOT NULL,
  car_model_year_end INT,

  car_make_id UUID REFERENCES make_table(make_id) NOT NULL,
  car_model_id UUID REFERENCES model_table(model_id) NOT NULL,
  car_magic_collar_id UUID REFERENCES magic_collar_table(magic_collar_id) NOT NULL,
  car_image_attachment_id UUID REFERENCES attachment_table(attachment_id) NOT NULL,

  car_created_by_admin_user_id UUID REFERENCES user_table(user_id) NOT NULL,
  car_updated_by_admin_user_id UUID REFERENCES user_table(user_id),

  CONSTRAINT car_model_year_range_check CHECK (
    car_model_year_end IS NULL OR car_model_year_end >= car_model_year_start
  )
);

CREATE TABLE pickup_address_table(
  pickup_address_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  pickup_address_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  pickup_address_date_updated TIMESTAMPTZ,
  pickup_address_is_disabled BOOLEAN DEFAULT false NOT NULL,
  pickup_address_is_available BOOLEAN DEFAULT true NOT NULL,
  pickup_address_longitude NUMERIC(9, 6) NOT NULL,
  pickup_address_latitude NUMERIC(9, 6) NOT NULL,

  pickup_address_address_id UUID REFERENCES address_table(address_id) NOT NULL,
  pickup_address_created_by_admin_user_id UUID REFERENCES user_table(user_id) NOT NULL,
  pickup_address_updated_by_admin_user_id UUID REFERENCES user_table(user_id)
);

CREATE TABLE batch_table(
  batch_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  batch_number INT DEFAULT nextval('batch_number_seq') UNIQUE NOT NULL,
  batch_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  batch_date_updated TIMESTAMPTZ,
  batch_is_disabled BOOLEAN DEFAULT false NOT NULL,
  batch_status batch_status DEFAULT 'PENDING' NOT NULL
);

CREATE TABLE batch_status_log_table(
  batch_status_log_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  batch_status_log_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  batch_status_log_old_status batch_status,
  batch_status_log_new_status batch_status NOT NULL,

  batch_status_log_batch_id UUID REFERENCES batch_table(batch_id) NOT NULL,
  batch_status_log_updated_by UUID REFERENCES user_table(user_id)
);

CREATE TABLE order_table(
  order_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  order_number INT DEFAULT nextval('order_number_seq') UNIQUE NOT NULL,
  order_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  order_date_updated TIMESTAMPTZ,
  order_is_disabled BOOLEAN DEFAULT false NOT NULL,
  order_status order_status DEFAULT 'PENDING' NOT NULL,
  order_payment_status order_payment_status DEFAULT 'PENDING' NOT NULL,

  order_fulfillment order_fulfillment NOT NULL,

  order_delivery_courier TEXT,
  order_delivery_detail_full_name TEXT,
  order_delivery_detail_phone_number TEXT,

  order_address_region TEXT NOT NULL,
  order_address_province TEXT NOT NULL,
  order_address_city TEXT NOT NULL,
  order_address_barangay TEXT NOT NULL,
  order_address_street TEXT NOT NULL,
  order_address_postal_code TEXT NOT NULL,
  order_address_longitude NUMERIC(9, 6),
  order_address_latitude NUMERIC(9, 6),

  order_down_payment_amount NUMERIC(10, 2) NOT NULL,
  order_down_payment_fee NUMERIC(10, 2) NOT NULL,

  order_user_id UUID REFERENCES user_table(user_id) NOT NULL
);

CREATE TABLE order_status_log_table(
  order_status_log_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  order_status_log_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  order_status_log_old_status order_status,
  order_status_log_new_status order_status NOT NULL,

  order_status_log_order_id UUID REFERENCES order_table(order_id) NOT NULL,
  order_status_log_updated_by UUID REFERENCES user_table(user_id)
);

CREATE TABLE order_item_table(
  order_item_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  order_item_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  order_item_date_updated TIMESTAMPTZ,
  order_item_is_disabled BOOLEAN DEFAULT false NOT NULL,
  order_item_status order_item_status DEFAULT 'PENDING' NOT NULL,
  order_item_quantity INT NOT NULL,
  order_item_price NUMERIC(10, 2) NOT NULL,

  order_item_car_model_code TEXT,
  order_item_car_model_year_start INT NOT NULL,
  order_item_car_model_year_end INT,
  order_item_car_make TEXT NOT NULL,
  order_item_car_model TEXT NOT NULL,
  
  order_item_magic_collar_price NUMERIC(10, 2) NOT NULL,
  order_item_magic_collar_price_currency TEXT DEFAULT 'PHP' NOT NULL,
  order_item_magic_collar_down_payment_price NUMERIC(10, 2) NOT NULL,
  order_item_magic_collar_front_quantity INT,
  order_item_magic_collar_rear_quantity INT,
  order_item_magic_collar_all_quantity INT,
  
  order_item_car_image_attachment_id UUID REFERENCES attachment_table(attachment_id) NOT NULL,
  order_item_order_id UUID REFERENCES order_table(order_id) NOT NULL,
  order_item_batch_id UUID REFERENCES batch_table(batch_id),

  CONSTRAINT order_item_quantity_check CHECK (order_item_quantity > 0)
);

CREATE TABLE order_item_status_log_table(
  order_item_status_log_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  order_item_status_log_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  order_item_status_log_old_status order_item_status,
  order_item_status_log_new_status order_item_status NOT NULL,

  order_item_status_log_order_item_id UUID REFERENCES order_item_table(order_item_id) NOT NULL,
  order_item_status_log_updated_by UUID REFERENCES user_table(user_id)
);

CREATE TABLE checkout_table(
  checkout_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  checkout_url TEXT NOT NULL,
  checkout_intent_id TEXT NOT NULL,
  checkout_session_id TEXT NOT NULL
);

CREATE TABLE payment_table(
  payment_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  payment_date_created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_date_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_is_disabled BOOLEAN DEFAULT false NOT NULL,

  -- PayMongo refs
  payment_external_id TEXT,

  -- Status
  payment_status payment_status NOT NULL,

  -- Details
  payment_amount NUMERIC(10, 2) NOT NULL,
  payment_currency TEXT NOT NULL DEFAULT 'PHP',
  payment_method TEXT NOT NULL,
  payment_description payment_description NOT NULL,

  -- Timestamps
  payment_date_paid TIMESTAMPTZ,
  
  -- Error
  payment_failure_message TEXT,
  payment_failure_code TEXT,

  -- Linking
  payment_order_id UUID REFERENCES order_table(order_id) NOT NULL,
  payment_checkout_id UUID REFERENCES checkout_table(checkout_id) NOT NULL
);

CREATE TABLE system_setting_table(
  system_setting_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  system_setting_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  system_setting_date_updated TIMESTAMPTZ,
  system_setting_key settings NOT NULL,
  system_setting_value TEXT NOT NULL,
  
  system_setting_updated_by_admin_user_id UUID REFERENCES user_table(user_id)
);

CREATE TABLE payment_channel_table(
  payment_channel_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  payment_channel_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  payment_channel_date_updated TIMESTAMPTZ,
  payment_channel_is_disabled BOOLEAN DEFAULT false NOT NULL,
  payment_channel_is_active BOOLEAN DEFAULT true NOT NULL,
  payment_channel_provider_name TEXT NOT NULL,
  payment_channel_account_name TEXT NOT NULL,
  payment_channel_account_identifier TEXT NOT NULL,
  
  payment_channel_qr_code_attachment_id UUID REFERENCES attachment_table(attachment_id) NOT NULL,
  payment_channel_created_by_admin_user_id UUID REFERENCES user_table(user_id) NOT NULL,
  payment_channel_updated_by_admin_user_id UUID REFERENCES user_table(user_id)
);

CREATE TABLE order_payment_table(
  order_payment_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  order_payment_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  order_payment_date_updated TIMESTAMPTZ,
  order_payment_request_status order_payment_request_status DEFAULT 'PENDING' NOT NULL,
  order_payment_rejection_reason TEXT,
  order_payment_amount NUMERIC(10, 2),
  order_payment_transaction_id TEXT UNIQUE,

  order_payment_proof_attachment_id UUID REFERENCES attachment_table(attachment_id) NOT NULL,
  order_payment_payment_channel_id UUID REFERENCES payment_channel_table(payment_channel_id) NOT NULL,
  order_payment_order_id UUID REFERENCES order_table(order_id) NOT NULL,
  order_payment_processed_by_admin_user_id UUID REFERENCES user_table(user_id)
);

CREATE TABLE courier_table(
  courier_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  courier_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  courier_date_updated TIMESTAMPTZ,
  courier_is_disabled BOOLEAN DEFAULT false NOT NULL,
  courier_is_active BOOLEAN DEFAULT true NOT NULL,
  courier_name TEXT NOT NULL,

  courier_created_by_admin_user_id UUID REFERENCES user_table(user_id) NOT NULL,
  courier_updated_by_admin_user_id UUID REFERENCES user_table(user_id)
);

GRANT ALL ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA public TO POSTGRES;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT USAGE, SELECT ON SEQUENCE magic_collar_number_seq TO public;
GRANT USAGE, SELECT ON SEQUENCE order_number_seq TO public;
GRANT USAGE, SELECT ON SEQUENCE batch_number_seq TO public;