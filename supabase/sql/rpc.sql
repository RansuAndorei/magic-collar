CREATE OR REPLACE FUNCTION get_server_time()
RETURNS TIMESTAMPTZ
AS $$
BEGIN
  RETURN NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_email_resend_timer(input_data JSONB)
RETURNS INTEGER
AS $$
DECLARE
  input_email TEXT := (input_data->>'email')::TEXT;

  var_email_resend_record RECORD;
  var_current_ts TIMESTAMPTZ;
  var_diff_in_seconds INTEGER;
  
  return_data INTEGER;
BEGIN
  SELECT *
  INTO var_email_resend_record
  FROM email_resend_table
  WHERE email_resend_email = input_email
  ORDER BY email_resend_date_created DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  var_current_ts := NOW();
  var_diff_in_seconds := EXTRACT(EPOCH FROM (var_current_ts - var_email_resend_record.email_resend_date_created));
  return_data := 60 - CEIL(var_diff_in_seconds);
  IF return_data <= 0 THEN
    RETURN 0;
  ELSE
    RETURN return_data;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION onboard_user(input_data JSONB)
RETURNS JSONB
AS $$
DECLARE
  input_user_data JSONB := input_data->'userData';
  input_address_data JSONB := input_data->'addressData';

  var_user_id UUID := (input_user_data->>'user_id')::UUID;
  var_user_email TEXT := (input_user_data->>'user_email')::TEXT;
  var_user_first_name TEXT := (input_user_data->>'user_first_name')::TEXT;
  var_user_last_name TEXT := (input_user_data->>'user_last_name')::TEXT;
  var_user_phone_number TEXT := (input_user_data->>'user_phone_number')::TEXT;
  var_user_avatar TEXT := (input_user_data->>'user_avatar')::TEXT;

  var_address_item JSONB;
  var_address_id UUID;

  return_data JSONB;
BEGIN

  -- =========================================
  -- 1. Insert / update user
  -- =========================================
  INSERT INTO user_table (
    user_id,
    user_first_name,
    user_last_name,
    user_email,
    user_phone_number,
    user_avatar
  )
  VALUES (
    var_user_id,
    var_user_first_name,
    var_user_last_name,
    var_user_email,
    var_user_phone_number,
    var_user_avatar
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    user_first_name = EXCLUDED.user_first_name,
    user_last_name = EXCLUDED.user_last_name,
    user_phone_number = EXCLUDED.user_phone_number,
    user_avatar = EXCLUDED.user_avatar;

  -- build base return
  return_data := JSONB_BUILD_OBJECT(
    'user_id', var_user_id,
    'user_first_name', var_user_first_name,
    'user_last_name', var_user_last_name,
    'user_email', var_user_email,
    'user_phone_number', var_user_phone_number,
    'user_avatar', var_user_avatar
  );

  -- =========================================
  -- 2. Loop addresses
  -- =========================================
  FOR var_address_item IN
    SELECT value FROM jsonb_array_elements(input_address_data)
  LOOP

    INSERT INTO address_table (
      address_region,
      address_province,
      address_city,
      address_barangay,
      address_street,
      address_postal_code
    )
    VALUES (
      (var_address_item->>'region')::TEXT,
      (var_address_item->>'province')::TEXT,
      (var_address_item->>'city')::TEXT,
      (var_address_item->>'barangay')::TEXT,
      (var_address_item->>'street')::TEXT,
      (var_address_item->>'postalCode')::TEXT
    )
    RETURNING address_id INTO var_address_id;

    INSERT INTO delivery_detail_table (
      delivery_detail_full_name,
      delivery_detail_phone_number,
      delivery_detail_is_default,
      delivery_detail_address_id,
      delivery_detail_user_id
    )
    VALUES (
      (var_address_item->>'fullName')::TEXT,
      (var_address_item->>'phone')::TEXT,
      COALESCE((var_address_item->>'isDefault')::BOOLEAN, FALSE),
      var_address_id,
      var_user_id
    );
  END LOOP;

  RETURN return_data;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_all_car(input_data JSONB)
RETURNS JSONB
AS $$
DECLARE
  input_index INT := COALESCE((input_data->>'index')::INT, 0);
  input_limit INT := COALESCE((input_data->>'limit')::INT, 1000);

  return_data JSONB;
BEGIN
  SELECT COALESCE(
    JSONB_AGG(
      TO_JSONB(car_table.*) || JSONB_BUILD_OBJECT(
        'car_make', make,
        'car_model', model,
        'car_magic_collar', TO_JSONB(magic_collar_table.*),
        'car_image_attachment', TO_JSONB(attachment_table.*)
      )
    ),
    '[]'::JSONB
  )
  INTO return_data
  FROM car_table
  INNER JOIN make_table
    ON make_id = car_make_id
    AND make_is_disabled = false
    AND make_is_available = true
  INNER JOIN model_table
    ON model_id = car_model_id
    AND model_is_disabled = false
    AND model_is_available = true
  INNER JOIN magic_collar_table
    ON magic_collar_id = car_magic_collar_id
    AND magic_collar_is_disabled = false
    AND magic_collar_is_available = true
  INNER JOIN attachment_table
    ON attachment_id = car_image_attachment_id
    AND attachment_is_disabled = false
  WHERE
    car_is_disabled = false
    AND car_is_available = true
  OFFSET input_index
  LIMIT input_limit;

  RETURN return_data;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_customer_order_list(input_data JSONB)
RETURNS JSONB
AS $$
DECLARE
  input_user_id UUID := (input_data->>'userId')::UUID;
  input_index INT := COALESCE((input_data->>'index')::INT, 0);
  input_limit INT := COALESCE((input_data->>'limit')::INT, 5);
  input_search TEXT := NULLIF(TRIM(COALESCE(input_data->>'search', '')), '');
  input_order_status TEXT := COALESCE(input_data->>'orderStatus', 'ALL');
  input_payment_status TEXT := COALESCE(input_data->>'paymentStatus', 'ALL');
  input_order_number INT;

  var_total_count INT := 0;
  var_orders JSONB := '[]'::JSONB;
BEGIN
  IF input_search ~ '^[0-9]+$' AND length(input_search) <= 9 THEN
    input_order_number := input_search::INT;
  END IF;

  WITH filtered_orders AS (
    SELECT order_table.*
    FROM order_table
    WHERE
      order_user_id = input_user_id
      AND order_is_disabled = false
      AND (
        input_order_status = 'ALL'
        OR order_status = input_order_status::order_status
      )
      AND (
        input_payment_status = 'ALL'
        OR order_payment_status = input_payment_status::order_payment_status
      )
      AND EXISTS (
        SELECT 1
        FROM order_item_table
        WHERE
          order_item_order_id = order_id
          AND order_item_is_disabled = false
      )
      AND (
        input_search IS NULL
        OR order_number = input_order_number
        OR EXISTS (
          SELECT 1
          FROM order_item_table
          WHERE
            order_item_order_id = order_id
            AND order_item_is_disabled = false
            AND (
              order_item_car_make ILIKE '%' || input_search || '%'
              OR order_item_car_model ILIKE '%' || input_search || '%'
              OR order_item_car_model_code ILIKE '%' || input_search || '%'
            )
        )
      )
  ),
  paged_orders AS (
    SELECT *
    FROM filtered_orders
    ORDER BY order_date_created DESC
    OFFSET input_index
    LIMIT input_limit
  )
  SELECT
    (SELECT COUNT(*) FROM filtered_orders),
    COALESCE(
      JSONB_AGG(
        TO_JSONB(paged_orders.*) || JSONB_BUILD_OBJECT(
          'order_item',
          COALESCE(
            (
              SELECT JSONB_AGG(
                TO_JSONB(order_item_table.*) || JSONB_BUILD_OBJECT(
                  'order_item_car_image_attachment', TO_JSONB(attachment_table.*),
                  'order_item_batch', TO_JSONB(batch_table.*)
                )
                ORDER BY order_item_date_created ASC
              )
              FROM order_item_table
              LEFT JOIN attachment_table
                ON attachment_id = order_item_car_image_attachment_id
              LEFT JOIN batch_table
                ON batch_id = order_item_batch_id
              WHERE
                order_item_order_id = paged_orders.order_id
                AND order_item_is_disabled = false
            ),
            '[]'::JSONB
          )
        )
        ORDER BY order_date_created DESC
      ),
      '[]'::JSONB
    )
  INTO var_total_count, var_orders
  FROM paged_orders;

  RETURN JSONB_BUILD_OBJECT(
    'orders', var_orders,
    'totalCount', var_total_count
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_order(input_data JSONB)
RETURNS JSONB
AS $$
DECLARE
  input_order_data JSONB := (input_data->'orderData');
  input_total_quantity INT := COALESCE((input_data->>'totalQuantity')::INT, 0);
  input_user_id UUID := (input_data->>'userId')::UUID;
  input_payment_fee_percentage NUMERIC := (input_data->>'paymentFeePercentage')::NUMERIC;
  input_payment_data JSONB := (input_data->'paymentData');

  var_total_downpayment NUMERIC := 0;
  var_downpayment_fee NUMERIC;
  var_downpayment_amount NUMERIC;
  var_batch_limit INT := 0;
  var_current_batch_limit INT := 0;
  var_current_batch_id UUID;
  var_current_batch_delivery_details JSONB;
  var_order_items JSONB;
  var_remaining_items JSONB;
  var_updated_items JSONB;
  var_order_id UUID;

  var_item JSONB;
  var_item_quantity INT;
  var_item_insert_quantity INT;
  var_batch_remaining INT;

  -- stock-related variables
  var_stock_quantity INT;
  var_stock_deduct INT;
  var_batch_quantity INT;
  var_magic_collar_id UUID;

  -- idempotency variable
  var_existing_order_id UUID;

  var_order_item_id UUID;
BEGIN
  -- IDEMPOTENCY GUARD: if this checkout_id was already processed, return the existing order
  SELECT payment_order_id
  INTO var_existing_order_id
  FROM payment_table
  WHERE payment_checkout_id = (input_payment_data->>'payment_checkout_id')::UUID;

  IF FOUND THEN
    RETURN JSONB_BUILD_OBJECT('orderId', var_existing_order_id);
  END IF;

  -- get the batch limit
  SELECT system_setting_value::INT
  INTO var_batch_limit
  FROM system_setting_table
  WHERE system_setting_key = 'BATCH_LIMIT';

  IF NOT FOUND OR var_batch_limit = 0 THEN
    RAISE EXCEPTION 'Missing Batch Limit';
  END IF;

  -- fetch order item data (includes magic_collar_id and magic_collar_stock_quantity)
  SELECT JSONB_AGG(ROW_TO_JSON(item_details))
  INTO var_order_items
  FROM (
    SELECT
      (item->>'quantity')::INT AS quantity,
      car_model_code,
      car_model_year_start,
      car_model_year_end,
      car_image_attachment_id,
      make,
      model,
      magic_collar_id,
      magic_collar_price,
      magic_collar_price_currency,
      magic_collar_down_payment_price,
      magic_collar_front_quantity,
      magic_collar_rear_quantity,
      magic_collar_all_quantity,
      magic_collar_stock_quantity
    FROM JSONB_ARRAY_ELEMENTS(input_order_data->'items') AS item
    INNER JOIN car_table ON car_id = (item->>'id')::UUID
    INNER JOIN make_table ON make_id = car_make_id
    INNER JOIN model_table ON model_id = car_model_id
    INNER JOIN magic_collar_table ON magic_collar_id = car_magic_collar_id
    INNER JOIN attachment_table ON attachment_id = car_image_attachment_id
  ) item_details;

  -- compute total downpayment from the fetched items
  SELECT SUM((item->>'magic_collar_down_payment_price')::NUMERIC * (item->>'quantity')::INT)
  INTO var_total_downpayment
  FROM JSONB_ARRAY_ELEMENTS(var_order_items) AS item;

  -- compute fee
  SELECT transfer_fee, total_amount
  INTO var_downpayment_fee, var_downpayment_amount
  FROM calculate_fee(var_total_downpayment, input_payment_fee_percentage);

  -- fetch delivery details
  SELECT JSONB_BUILD_OBJECT(
    'delivery_detail_full_name', delivery_detail_full_name,
    'delivery_detail_phone_number', delivery_detail_phone_number,
    'address_region', address_region,
    'address_province', address_province,
    'address_city', address_city,
    'address_barangay', address_barangay,
    'address_street', address_street,
    'address_postal_code', address_postal_code
  )
  INTO var_current_batch_delivery_details
  FROM delivery_detail_table
  INNER JOIN address_table ON address_id = delivery_detail_address_id
  WHERE delivery_detail_id = (input_order_data->>'selectedAddressId')::UUID;

  -- insert order
  INSERT INTO order_table (
    order_fulfillment,
    order_delivery_detail_full_name,
    order_delivery_detail_phone_number,
    order_address_region,
    order_address_province,
    order_address_city,
    order_address_barangay,
    order_address_street,
    order_address_postal_code,
    order_downpayment_amount,
    order_downpayment_fee,
    order_user_id
  ) VALUES (
    (input_order_data->>'fulfillmentType')::order_fulfillment,
    var_current_batch_delivery_details->>'delivery_detail_full_name',
    var_current_batch_delivery_details->>'delivery_detail_phone_number',
    var_current_batch_delivery_details->>'address_region',
    var_current_batch_delivery_details->>'address_province',
    var_current_batch_delivery_details->>'address_city',
    var_current_batch_delivery_details->>'address_barangay',
    var_current_batch_delivery_details->>'address_street',
    var_current_batch_delivery_details->>'address_postal_code',
    var_downpayment_amount,
    var_downpayment_fee,
    input_user_id
  )
  RETURNING order_id INTO var_order_id;

  INSERT INTO order_status_log_table (
    order_status_log_old_status,
    order_status_log_new_status,
    order_status_log_order_id
  ) VALUES (
    NULL,
    'PENDING',
    var_order_id
  );

  -- create payment (linked to order, after order is created)
  INSERT INTO payment_table (
    payment_external_id,
    payment_status,
    payment_amount,
    payment_currency,
    payment_method,
    payment_description,
    payment_checkout_id,
    payment_order_id
  ) VALUES (
    (input_payment_data->>'payment_external_id'),
    (input_payment_data->>'payment_status')::payment_status,
    (input_payment_data->>'payment_amount')::NUMERIC(10, 2),
    (input_payment_data->>'payment_currency'),
    (input_payment_data->>'payment_method'),
    (input_payment_data->>'payment_description')::payment_description,
    (input_payment_data->>'payment_checkout_id')::UUID,
    var_order_id
  );

  -- pre-pass: fulfill from stock first, build remaining items for batch
  var_remaining_items := '[]'::JSONB;

  FOR var_item IN SELECT * FROM JSONB_ARRAY_ELEMENTS(var_order_items)
  LOOP
    var_item_quantity   := (var_item->>'quantity')::INT;
    var_stock_quantity  := COALESCE((var_item->>'magic_collar_stock_quantity')::INT, 0);
    var_magic_collar_id := (var_item->>'magic_collar_id')::UUID;

    -- how much can we pull from stock?
    var_stock_deduct  := LEAST(var_item_quantity, var_stock_quantity);
    -- how much still needs to go into a batch?
    var_batch_quantity := var_item_quantity - var_stock_deduct;

    -- deduct stock and insert a stock-fulfilled order item (no batch)
    IF var_stock_deduct > 0 THEN
      UPDATE magic_collar_table
      SET magic_collar_stock_quantity = magic_collar_stock_quantity - var_stock_deduct
      WHERE magic_collar_id = var_magic_collar_id;

      INSERT INTO order_item_table (
        order_item_quantity,
        order_item_price,
        order_item_car_model_code,
        order_item_car_model_year_start,
        order_item_car_model_year_end,
        order_item_car_make,
        order_item_car_model,
        order_item_magic_collar_price,
        order_item_magic_collar_price_currency,
        order_item_magic_collar_down_payment_price,
        order_item_magic_collar_front_quantity,
        order_item_magic_collar_rear_quantity,
        order_item_magic_collar_all_quantity,
        order_item_car_image_attachment_id,
        order_item_order_id,
        order_item_batch_id
      ) VALUES (
        var_stock_deduct,
        (var_item->>'magic_collar_price')::NUMERIC,
        var_item->>'car_model_code',
        (var_item->>'car_model_year_start')::INT,
        (var_item->>'car_model_year_end')::INT,
        var_item->>'make',
        var_item->>'model',
        (var_item->>'magic_collar_price')::NUMERIC,
        var_item->>'magic_collar_price_currency',
        (var_item->>'magic_collar_down_payment_price')::NUMERIC,
        (var_item->>'magic_collar_front_quantity')::INT,
        (var_item->>'magic_collar_rear_quantity')::INT,
        (var_item->>'magic_collar_all_quantity')::INT,
        (var_item->>'car_image_attachment_id')::UUID,
        var_order_id,
        NULL  -- fulfilled from stock, no batch needed
      )
      RETURNING order_item_id
      INTO var_order_item_id;

      INSERT INTO order_item_status_log_table (
        order_item_status_log_old_status,
        order_item_status_log_new_status,
        order_item_status_log_order_item_id
      ) VALUES (
        NULL,
        'IN STOCK',
        var_order_item_id
      );
    END IF;

    -- queue the remainder for batch distribution
    IF var_batch_quantity > 0 THEN
      var_remaining_items := var_remaining_items || JSONB_BUILD_ARRAY(
        var_item || JSONB_BUILD_OBJECT('quantity', var_batch_quantity)
      );
    END IF;
  END LOOP;

  -- FIX #3: recompute input_total_quantity from only items still needing a batch
  -- avoids double-subtraction from the stock pre-pass and the WHILE loop both decrementing it
  SELECT COALESCE(SUM((item->>'quantity')::INT), 0)
  INTO input_total_quantity
  FROM JSONB_ARRAY_ELEMENTS(var_remaining_items) AS item;

  -- distribute remaining (non-stock) items across batches
  WHILE input_total_quantity > 0 LOOP
    -- get latest pending batch and its remaining capacity
    SELECT
      batch_id,
      var_batch_limit - COALESCE(SUM(order_item_quantity), 0)
    INTO
      var_current_batch_id,
      var_current_batch_limit
    FROM batch_table
    LEFT JOIN order_item_table ON order_item_batch_id = batch_id
      AND order_item_is_disabled = false
    WHERE batch_is_disabled = false
      AND batch_status = 'PENDING'
    GROUP BY batch_id
    ORDER BY batch_date_created DESC
    LIMIT 1;

    -- no pending batch or batch is full, create a new one
    IF var_current_batch_id IS NULL OR var_current_batch_limit = 0 THEN
      INSERT INTO batch_table DEFAULT VALUES
      RETURNING batch_id INTO var_current_batch_id;

      INSERT INTO batch_status_log_table (
        batch_status_log_old_status,
        batch_status_log_new_status,
        batch_status_log_batch_id
      ) VALUES (
        NULL,
        'PENDING',
        var_current_batch_id
      );

      var_current_batch_limit := var_batch_limit;
    END IF;

    var_batch_remaining := var_current_batch_limit;
    var_updated_items := '[]'::JSONB;

    -- iterate each item and fill batch, splitting quantity if needed
    FOR var_item IN SELECT * FROM JSONB_ARRAY_ELEMENTS(var_remaining_items)
    LOOP
      EXIT WHEN var_batch_remaining = 0;

      var_item_quantity := (var_item->>'quantity')::INT;
      var_item_insert_quantity := LEAST(var_item_quantity, var_batch_remaining);

      INSERT INTO order_item_table (
        order_item_quantity,
        order_item_price,
        order_item_car_model_code,
        order_item_car_model_year_start,
        order_item_car_model_year_end,
        order_item_car_make,
        order_item_car_model,
        order_item_magic_collar_price,
        order_item_magic_collar_price_currency,
        order_item_magic_collar_down_payment_price,
        order_item_magic_collar_front_quantity,
        order_item_magic_collar_rear_quantity,
        order_item_magic_collar_all_quantity,
        order_item_car_image_attachment_id,
        order_item_order_id,
        order_item_batch_id
      ) VALUES (
        var_item_insert_quantity,
        (var_item->>'magic_collar_price')::NUMERIC,
        var_item->>'car_model_code',
        (var_item->>'car_model_year_start')::INT,
        (var_item->>'car_model_year_end')::INT,
        var_item->>'make',
        var_item->>'model',
        (var_item->>'magic_collar_price')::NUMERIC,
        var_item->>'magic_collar_price_currency',
        (var_item->>'magic_collar_down_payment_price')::NUMERIC,
        (var_item->>'magic_collar_front_quantity')::INT,
        (var_item->>'magic_collar_rear_quantity')::INT,
        (var_item->>'magic_collar_all_quantity')::INT,
        (var_item->>'car_image_attachment_id')::UUID,
        var_order_id,
        var_current_batch_id
      )
      RETURNING order_item_id
      INTO var_order_item_id;

      INSERT INTO order_item_status_log_table (
        order_item_status_log_old_status,
        order_item_status_log_new_status,
        order_item_status_log_order_item_id
      ) VALUES (
        NULL,
        'PENDING',
        var_order_item_id
      );

      var_batch_remaining := var_batch_remaining - var_item_insert_quantity;
      input_total_quantity := input_total_quantity - var_item_insert_quantity;

      -- carry over remaining quantity to next batch
      IF var_item_quantity > var_item_insert_quantity THEN
        var_updated_items := var_updated_items || JSONB_BUILD_ARRAY(
          var_item || JSONB_BUILD_OBJECT('quantity', var_item_quantity - var_item_insert_quantity)
        );
      END IF;
    END LOOP;

    var_remaining_items := var_updated_items;

    -- if batch is now full, mark as ready for order
    IF var_batch_remaining = 0 THEN
      UPDATE batch_table
      SET batch_status = 'READY FOR ORDER'
      WHERE batch_id = var_current_batch_id;

      INSERT INTO batch_status_log_table (
        batch_status_log_old_status,
        batch_status_log_new_status,
        batch_status_log_batch_id
      ) VALUES (
        'PENDING',
        'READY FOR ORDER',
        var_current_batch_id
      );
    END IF;

  END LOOP;

  RETURN JSONB_BUILD_OBJECT('orderId', var_order_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_fee(
  total NUMERIC,
  rate NUMERIC
)
RETURNS TABLE(transfer_fee NUMERIC, total_amount NUMERIC)
AS $$
DECLARE
  var_base_gross NUMERIC;
  var_gross NUMERIC;
  var_fee NUMERIC;
  var_computed_net NUMERIC;
BEGIN
  var_base_gross := total / (1 - rate);
  var_gross := ROUND(var_base_gross, 2);
  var_fee := ROUND(var_gross * rate, 2);
  var_computed_net := ROUND(var_gross - var_fee, 2);

  IF var_computed_net <> total THEN
    var_gross := ROUND(var_gross + (total - var_computed_net), 2);
  END IF;

  transfer_fee := ROUND(var_gross * rate, 2);
  total_amount := var_gross;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_order_payment(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_attachment_bucket TEXT := (input_data->>'attachment_bucket')::TEXT;
  input_attachment_name TEXT := (input_data->>'attachment_name')::TEXT;
  input_attachment_path TEXT := (input_data->>'attachment_path')::TEXT;
  input_attachment_mime_type TEXT := (input_data->>'attachment_mime_type')::TEXT;
  input_attachment_size BIGINT := (input_data->>'attachment_size')::BIGINT;
  input_payment_channel_id UUID := (input_data->>'payment_channel_id')::UUID;
  input_order_id UUID := (input_data->>'order_id')::UUID;

  var_attachment_id UUID;
BEGIN
  INSERT INTO attachment_table (
    attachment_bucket,
    attachment_name,
    attachment_path,
    attachment_mime_type,
    attachment_size
  )
  VALUES (
    input_attachment_bucket,
    input_attachment_name,
    input_attachment_path,
    input_attachment_mime_type,
    input_attachment_size
  )
  RETURNING attachment_id INTO var_attachment_id;

  INSERT INTO order_payment_table (
    order_payment_proof_attachment_id,
    order_payment_payment_channel_id,
    order_payment_order_id
  )
  VALUES (
    var_attachment_id,
    input_payment_channel_id,
    input_order_id
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_order_payment_totals(input_data JSONB)
RETURNS JSONB
AS $$
DECLARE
  input_order_number INT := (input_data->>'order_number')::INT;

  var_pending_total  NUMERIC := 0;
  var_approved_total NUMERIC := 0;

  return_data JSONB;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN order_payment_request_status = 'PENDING'  THEN order_payment_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN order_payment_request_status = 'APPROVED' THEN order_payment_amount ELSE 0 END), 0)
  INTO
    var_pending_total,
    var_approved_total
  FROM order_payment_table
  JOIN order_table ON order_payment_order_id = order_id
  WHERE order_number = input_order_number;

  return_data := jsonb_build_object(
    'pendingPaymentTotal', var_pending_total,
    'approvedPaymentTotal', var_approved_total
  );

  RETURN return_data;
END;
$$ LANGUAGE plpgsql;