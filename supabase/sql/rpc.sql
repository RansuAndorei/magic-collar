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
      COALESCE((var_address_item->>'isDefault')::BOOLEAN, false),
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
  input_fulfillment TEXT := COALESCE(input_data->>'fulfillment', 'ALL');

  var_total_count INT := 0;
  var_orders JSONB := '[]'::JSONB;
  var_order_number INT;
BEGIN
  IF input_search ~ '^[0-9]+$' AND length(input_search) <= 9 THEN
    var_order_number := input_search::INT;
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
      AND (
        input_fulfillment = 'ALL'
        OR order_fulfillment = input_fulfillment::order_fulfillment
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
        OR order_number = var_order_number
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

  var_total_down_payment NUMERIC := 0;
  var_down_payment_fee NUMERIC;
  var_down_payment_amount NUMERIC;
  var_batch_limit INT := 0;
  var_current_batch_limit INT := 0;
  var_current_batch_id UUID;
  var_current_batch_address_details JSONB;
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
      car_id,
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

  -- compute total down_payment from the fetched items
  SELECT SUM((item->>'magic_collar_down_payment_price')::NUMERIC * (item->>'quantity')::INT)
  INTO var_total_down_payment
  FROM JSONB_ARRAY_ELEMENTS(var_order_items) AS item;

  -- compute fee
  SELECT transfer_fee, total_amount
  INTO var_down_payment_fee, var_down_payment_amount
  FROM calculate_fee(var_total_down_payment, input_payment_fee_percentage);

  IF input_order_data->>'fulfillmentType' = 'DELIVERY' THEN
    -- fetch delivery details
    SELECT JSONB_BUILD_OBJECT(
      'delivery_detail_full_name', delivery_detail_full_name,
      'delivery_detail_phone_number', delivery_detail_phone_number,
      'address_longitude', NULL,
      'address_latitude', NULL,
      'address_region', address_region,
      'address_province', address_province,
      'address_city', address_city,
      'address_barangay', address_barangay,
      'address_street', address_street,
      'address_postal_code', address_postal_code
    )
    INTO var_current_batch_address_details
    FROM delivery_detail_table
    INNER JOIN address_table ON address_id = delivery_detail_address_id
    WHERE delivery_detail_id = (input_order_data->>'selectedAddressId')::UUID;
  ELSIF input_order_data->>'fulfillmentType' = 'PICKUP' THEN
    -- fetch pickup details
    SELECT JSONB_BUILD_OBJECT(
      'delivery_detail_full_name', NULL,
      'delivery_detail_phone_number', NULL,
      'address_longitude', pickup_address_longitude,
      'address_latitude', pickup_address_latitude,
      'address_region', address_region,
      'address_province', address_province,
      'address_city', address_city,
      'address_barangay', address_barangay,
      'address_street', address_street,
      'address_postal_code', address_postal_code
    )
    INTO var_current_batch_address_details
    FROM pickup_address_table
    INNER JOIN address_table ON address_id = pickup_address_address_id
    WHERE pickup_address_id = (input_order_data->>'selectedAddressId')::UUID;
  END IF;

  -- insert order
  INSERT INTO order_table (
    order_fulfillment,
    order_delivery_courier,
    order_delivery_detail_full_name,
    order_delivery_detail_phone_number,
    order_address_longitude,
    order_address_latitude,
    order_address_region,
    order_address_province,
    order_address_city,
    order_address_barangay,
    order_address_street,
    order_address_postal_code,
    order_down_payment_amount,
    order_down_payment_fee,
    order_user_id
  ) VALUES (
    (input_order_data->>'fulfillmentType')::order_fulfillment,
    input_order_data->>'courier',
    var_current_batch_address_details->>'delivery_detail_full_name',
    var_current_batch_address_details->>'delivery_detail_phone_number',
    (var_current_batch_address_details->>'address_longitude')::NUMERIC,
    (var_current_batch_address_details->>'address_latitude')::NUMERIC,
    var_current_batch_address_details->>'address_region',
    var_current_batch_address_details->>'address_province',
    var_current_batch_address_details->>'address_city',
    var_current_batch_address_details->>'address_barangay',
    var_current_batch_address_details->>'address_street',
    var_current_batch_address_details->>'address_postal_code',
    var_down_payment_amount,
    var_down_payment_fee,
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
        order_item_batch_id,
        order_item_car_id
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
        NULL,  -- fulfilled from stock, no batch needed
        (var_item->>'car_id')::UUID
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
        order_item_batch_id,
        order_item_car_id
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
        var_current_batch_id,
        (var_item->>'car_id')::UUID
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
RETURNS NUMERIC
AS $$
DECLARE
  input_order_number INT := (input_data->>'orderNumber')::INT;
  var_pending_total  NUMERIC := 0;
  return_data NUMERIC;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN order_payment_request_status = 'APPROVED'  THEN order_payment_amount ELSE 0 END), 0)
  INTO return_data
  FROM order_payment_table
  INNER JOIN order_table
    ON order_payment_order_id = order_id
  WHERE order_number = input_order_number;

  RETURN return_data;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_admin_catalog_cars_page(input_data JSONB)
RETURNS JSONB
AS $$
DECLARE
  input_page INTEGER := (input_data->>'page')::INTEGER;
  input_records_per_page INTEGER := (input_data->>'recordsPerPage')::INTEGER;
  input_sort_column TEXT := (input_data->>'sortColumnAccessor')::TEXT;
  input_sort_direction TEXT := (input_data->>'sortDirection')::TEXT;
  input_search TEXT := TRIM(COALESCE(input_data->>'search', ''));
  input_status BOOLEAN := (input_data->>'status')::BOOLEAN;

  var_limit INTEGER := input_records_per_page;
  var_offset INTEGER := (input_page - 1) * input_records_per_page;
  var_ascending BOOLEAN := (input_sort_direction = 'asc');
  var_search_pattern TEXT;
  var_is_mc_ref_search BOOLEAN := false;
  var_mc_ref_number INTEGER;

  var_total_records INTEGER;
  var_records JSONB;
BEGIN
  IF input_search <> '' THEN
    var_search_pattern := '%' || input_search || '%';

    -- Detect "4 digit number" or "MC-" + 4 digit number format
    var_is_mc_ref_search := (
      input_search ~ '^[0-9]{4}$'
      OR input_search ~* '^MC-[0-9]{4}$'
    );

    IF var_is_mc_ref_search THEN
      -- Strip the "MC-" prefix (if present) and cast remaining digits to int
      var_mc_ref_number := REGEXP_REPLACE(input_search, '^MC-', '', 'i')::INTEGER;
    END IF;
  END IF;

  SELECT COUNT(*)
  INTO var_total_records
  FROM car_table
  INNER JOIN make_table ON make_id = car_make_id
  INNER JOIN model_table ON model_id = car_model_id
  INNER JOIN magic_collar_table ON magic_collar_id = car_magic_collar_id
  WHERE (
    input_search = ''
    OR car_model_code ILIKE var_search_pattern
    OR make ILIKE var_search_pattern
    OR model ILIKE var_search_pattern
    OR (var_is_mc_ref_search AND magic_collar_reference_number = var_mc_ref_number)
  )
  AND (
    input_status IS NULL
    OR car_is_available = input_status
  )
  AND car_is_disabled = false;

  IF var_total_records = 0 THEN
    RETURN JSONB_BUILD_OBJECT('records', '[]'::jsonb, 'totalRecords', 0);
  END IF;

  WITH page AS (
    SELECT car_table.*
    FROM car_table
    INNER JOIN make_table ON make_id = car_make_id
    INNER JOIN model_table ON model_id = car_model_id
    INNER JOIN magic_collar_table ON magic_collar_id = car_magic_collar_id
    WHERE (
      input_search = ''
      OR car_model_code ILIKE var_search_pattern
      OR make ILIKE var_search_pattern
      OR model ILIKE var_search_pattern
      OR (var_is_mc_ref_search AND magic_collar_reference_number = var_mc_ref_number)
    )
    AND (
      input_status IS NULL
      OR car_is_available = input_status
    )
    AND car_is_disabled = false
    ORDER BY
      CASE WHEN input_sort_column = 'magic_collar_stock_quantity' AND var_ascending
        THEN magic_collar_stock_quantity END ASC,
      CASE WHEN input_sort_column = 'magic_collar_stock_quantity' AND NOT var_ascending
        THEN magic_collar_stock_quantity END DESC,
      CASE WHEN input_sort_column = 'magic_collar_price' AND var_ascending
        THEN magic_collar_price END ASC,
      CASE WHEN input_sort_column = 'magic_collar_price' AND NOT var_ascending
        THEN magic_collar_price END DESC,
      CASE WHEN input_sort_column NOT IN ('magic_collar_stock_quantity', 'magic_collar_price') AND var_ascending
        THEN car_date_created END ASC,
      CASE WHEN input_sort_column NOT IN ('magic_collar_stock_quantity', 'magic_collar_price') AND NOT var_ascending
        THEN car_date_created END DESC,
      magic_collar_reference_number ASC
    LIMIT var_limit OFFSET var_offset
  )
  SELECT COALESCE(
    JSONB_AGG(
      TO_JSONB(page.*) ||
      JSONB_BUILD_OBJECT(
        'car_make', TO_JSONB(make_table.*),
        'car_model', TO_JSONB(model_table.*),
        'car_magic_collar', TO_JSONB(magic_collar_table.*),
        'car_image_attachment', TO_JSONB(attachment_table.*)
      )
    ),
    '[]'::JSONB
  )
  INTO var_records
  FROM page
  INNER JOIN make_table ON make_id = page.car_make_id
  INNER JOIN model_table ON model_id = page.car_model_id
  INNER JOIN magic_collar_table ON magic_collar_id = page.car_magic_collar_id
  INNER JOIN attachment_table ON attachment_id = page.car_image_attachment_id;

  RETURN JSONB_BUILD_OBJECT('records', var_records, 'totalRecords', var_total_records);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_car(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_make TEXT := (input_data->>'make')::TEXT;
  input_model TEXT := (input_data->>'model')::TEXT;
  input_model_code TEXT := input_data->>'modelCode';
  input_year_start INT := (input_data->>'yearStart')::INT;
  input_year_end INT := NULLIF(input_data->>'yearEnd', '')::INT;
  input_magic_collar_id UUID := (input_data->>'magicCollarId')::UUID;
  input_is_available BOOLEAN := (input_data->>'isAvailable')::BOOLEAN;
  input_user_id UUID := (input_data->>'userId')::UUID;
  input_attachment_data JSONB := (input_data->>'attachmentData')::JSONB;

  var_make_id UUID;
  var_model_id UUID;
  var_attachment_id UUID;
BEGIN
  SELECT make_id
  INTO var_make_id
  FROM make_table
  WHERE make = input_make;

  IF var_make_id IS NULL THEN
    INSERT INTO make_table (make)
    VALUES (input_make)
    RETURNING make_id
    INTO var_make_id;

    INSERT INTO model_table (model, model_make_id)
    VALUES (input_model, var_make_id)
    RETURNING model_id
    INTO var_model_id;
  ELSE
    UPDATE make_table
    SET make_is_disabled = false
    WHERE make_id = var_make_id;

    SELECT model_id
    INTO var_model_id
    FROM model_table
    WHERE model = input_model
      AND model_make_id = var_make_id;

    IF var_model_id IS NULL THEN
      INSERT INTO model_table (model, model_make_id)
      VALUES (input_model, var_make_id)
      RETURNING model_id
      INTO var_model_id;
    ELSE
      UPDATE model_table
      SET model_is_disabled = false
      WHERE model_id = var_model_id;
    END IF;
  END IF;

  INSERT INTO attachment_table (
    attachment_name,
    attachment_path,
    attachment_bucket,
    attachment_mime_type,
    attachment_size
  ) VALUES (
    (input_attachment_data->>'attachment_name'),
    (input_attachment_data->>'attachment_path'),
    (input_attachment_data->>'attachment_bucket'),
    (input_attachment_data->>'attachment_mime_type'),
    (input_attachment_data->>'attachment_size')::BIGINT
  )
  RETURNING attachment_id
  INTO var_attachment_id;

  INSERT INTO car_table (
    car_model_code,
    car_model_year_start,
    car_model_year_end,
    car_make_id,
    car_model_id,
    car_magic_collar_id,
    car_image_attachment_id,
    car_created_by_admin_user_id,
    car_is_available
  ) VALUES (
    input_model_code,
    input_year_start,
    input_year_end,
    var_make_id,
    var_model_id,
    input_magic_collar_id,
    var_attachment_id,
    input_user_id,
    input_is_available
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_car(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_car_id UUID := (input_data->>'carId')::UUID;
  input_make TEXT := (input_data->>'make')::TEXT;
  input_model TEXT := (input_data->>'model')::TEXT;
  input_model_code TEXT := input_data->>'modelCode';
  input_year_start INT := (input_data->>'yearStart')::INT;
  input_year_end INT := NULLIF(input_data->>'yearEnd', '')::INT;
  input_magic_collar_id UUID := (input_data->>'magicCollarId')::UUID;
  input_is_available BOOLEAN := (input_data->>'isAvailable')::BOOLEAN;
  input_user_id UUID := (input_data->>'userId')::UUID;

  input_attachment_data JSONB := (input_data->>'attachmentData')::JSONB;

  var_make_id UUID;
  var_model_id UUID;
  var_attachment_id UUID;
  var_old_make_id UUID;
  var_old_model_id UUID;
  var_old_attachment_id UUID;
BEGIN
  SELECT make_id
  INTO var_make_id
  FROM make_table
  WHERE make = input_make;

  IF var_make_id IS NULL THEN
    INSERT INTO make_table (make)
    VALUES (input_make)
    RETURNING make_id
    INTO var_make_id;

    INSERT INTO model_table (model, model_make_id)
    VALUES (input_model, var_make_id)
    RETURNING model_id
    INTO var_model_id;
  ELSE
    UPDATE make_table
    SET make_is_disabled = false
    WHERE make_id = var_make_id;

    SELECT model_id
    INTO var_model_id
    FROM model_table
    WHERE model = input_model
      AND model_make_id = var_make_id;

    IF var_model_id IS NULL THEN
      INSERT INTO model_table (model, model_make_id)
      VALUES (input_model, var_make_id)
      RETURNING model_id
      INTO var_model_id;
    ELSE
      UPDATE model_table
      SET model_is_disabled = false
      WHERE model_id = var_model_id;
    END IF;
  END IF;

  SELECT
    car_make_id,
    car_model_id,
    car_image_attachment_id
  INTO
    var_old_make_id,
    var_old_model_id,
    var_old_attachment_id
  FROM car_table
  WHERE car_id = input_car_id;

  IF input_attachment_data IS NOT NULL THEN
    INSERT INTO attachment_table (
      attachment_name,
      attachment_path,
      attachment_bucket,
      attachment_mime_type,
      attachment_size
    ) VALUES (
      (input_attachment_data->>'attachment_name'),
      (input_attachment_data->>'attachment_path'),
      (input_attachment_data->>'attachment_bucket'),
      (input_attachment_data->>'attachment_mime_type'),
      (input_attachment_data->>'attachment_size')::BIGINT
    )
    RETURNING attachment_id
    INTO var_attachment_id;

    DELETE
    FROM attachment_table
    WHERE attachment_id = var_old_attachment_id;
  END IF;

  UPDATE car_table
  SET
    car_model_code = input_model_code,
    car_model_year_start = input_year_start,
    car_model_year_end = input_year_end,
    car_make_id = var_make_id,
    car_model_id = var_model_id,
    car_magic_collar_id = input_magic_collar_id,
    car_image_attachment_id = COALESCE(var_attachment_id, car_image_attachment_id),
    car_is_available = input_is_available,
    car_updated_by_admin_user_id = input_user_id,
    car_date_updated = NOW()
  WHERE car_id = input_car_id;

  IF var_old_model_id IS DISTINCT FROM var_model_id THEN
    IF NOT EXISTS (
      SELECT 1
      FROM car_table
      WHERE car_model_id = var_old_model_id
        AND car_is_disabled = false
    ) THEN
      UPDATE model_table
      SET
        model_is_disabled = true
      WHERE model_id = var_old_model_id;
    END IF;
  END IF;

  -- Old make is no longer used
  IF var_old_make_id IS DISTINCT FROM var_make_id THEN
    IF NOT EXISTS (
      SELECT 1
      FROM car_table
      WHERE car_make_id = var_old_make_id
        AND car_is_disabled = false
    ) THEN
      UPDATE make_table
      SET
        make_is_disabled = true
      WHERE make_id = var_old_make_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_connected_cars(input_data JSONB)
RETURNS JSONB
AS $$
DECLARE
  input_magic_collar_id UUID := (input_data->>'magicCollarId')::UUID;

  return_data JSONB;
BEGIN
  WITH car_data AS (
    SELECT
      car_table.*,
      make_table.make,
      model_table.model
    FROM car_table
    INNER JOIN make_table
      ON make_id = car_make_id
    INNER JOIN model_table
      ON model_id = car_model_id
    WHERE car_magic_collar_id = input_magic_collar_id
      AND car_is_disabled = false
    ORDER BY make, model, car_date_created
  )
  SELECT JSONB_AGG(
    TO_JSONB(car_data) - 'make' - 'model' ||JSONB_BUILD_OBJECT(
      'car_make', make,
      'car_model', model
    )
  )
  FROM car_data
  INTO return_data;

  RETURN COALESCE(return_data, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_catalog_car_availability(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_car_id UUID := (input_data->>'carId')::UUID;
  input_admin_user_id UUID := (input_data->>'adminUserId')::UUID;
  input_is_available BOOLEAN := (input_data->>'isAvailable')::BOOLEAN;
BEGIN
  UPDATE car_table
  SET
    car_is_available = input_is_available,
    car_date_updated = NOW(),
    car_updated_by_admin_user_id = input_admin_user_id
  WHERE car_id = input_car_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_catalog_magic_collar_availability(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_magic_collar_id UUID := (input_data->>'magicCollarId')::UUID;
  input_admin_user_id UUID := (input_data->>'adminUserId')::UUID;
  input_is_available BOOLEAN := (input_data->>'isAvailable')::BOOLEAN;
BEGIN
  UPDATE magic_collar_table
  SET
    magic_collar_is_available = input_is_available,
    magic_collar_date_updated = NOW(),
    magic_collar_updated_by_admin_user_id = input_admin_user_id
  WHERE magic_collar_id = input_magic_collar_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_catalog_car(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_car_id UUID := (input_data->>'carId')::UUID;
  input_admin_user_id UUID := (input_data->>'adminUserId')::UUID;

  var_car_make_id UUID;
  var_car_model_id UUID;
BEGIN
  UPDATE car_table
  SET
    car_is_disabled = true,
    car_date_updated = NOW(),
    car_updated_by_admin_user_id = input_admin_user_id
  WHERE car_id = input_car_id
  RETURNING car_make_id, car_model_id
  INTO var_car_make_id, var_car_model_id;

  IF NOT EXISTS (
    SELECT 1
    FROM car_table
    WHERE car_model_id = var_car_model_id
      AND car_is_disabled = false
  ) THEN
    UPDATE model_table
    SET model_is_disabled = true
    WHERE model_id = var_car_model_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM car_table
    WHERE car_make_id = var_car_make_id
      AND car_is_disabled = false
  ) THEN
    UPDATE make_table
    SET make_is_disabled = true
    WHERE make_id = var_car_make_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_catalog_magic_collar(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_magic_collar_id UUID := (input_data->>'magicCollarId')::UUID;
  input_admin_user_id UUID := (input_data->>'adminUserId')::UUID;
BEGIN
  UPDATE magic_collar_table
  SET
    magic_collar_is_disabled = true,
    magic_collar_date_updated = NOW(),
    magic_collar_updated_by_admin_user_id = input_admin_user_id
  WHERE magic_collar_id = input_magic_collar_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_magic_collar(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_magic_collar_id UUID := (input_data->>'magicCollarId')::UUID;
  input_magic_collar_update JSONB := (input_data->'magicCollarUpdate')::JSONB;
BEGIN
  UPDATE magic_collar_table
  SET
    magic_collar_price = (input_magic_collar_update->>'magic_collar_price')::NUMERIC(10, 2),
    magic_collar_price_currency = (input_magic_collar_update->>'magic_collar_price_currency')::TEXT,
    magic_collar_is_available = (input_magic_collar_update->>'magic_collar_is_available')::BOOLEAN,
    magic_collar_down_payment_price = (input_magic_collar_update->>'magic_collar_down_payment_price')::NUMERIC(10, 2),
    magic_collar_front_quantity = (input_magic_collar_update->>'magic_collar_front_quantity')::INT,
    magic_collar_rear_quantity = (input_magic_collar_update->>'magic_collar_rear_quantity')::INT,
    magic_collar_all_quantity = (input_magic_collar_update->>'magic_collar_all_quantity')::INT,
    magic_collar_stock_quantity = (input_magic_collar_update->>'magic_collar_stock_quantity')::INT,
    magic_collar_updated_by_admin_user_id = (input_magic_collar_update->>'magic_collar_updated_by_admin_user_id')::UUID,
    magic_collar_date_updated = NOW()
  WHERE magic_collar_id = input_magic_collar_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_admin_orders_page(input_data JSONB)
RETURNS JSONB
AS $$
DECLARE
  input_page INT := (input_data->>'page')::INT;
  input_records_per_page INT := (input_data->>'recordsPerPage')::INT;
  input_search TEXT := TRIM(REGEXP_REPLACE(input_data->>'search', '[%_]', '', 'g'));
  input_order_status TEXT := input_data->>'orderStatus';
  input_payment_status TEXT := input_data->>'paymentStatus';
  input_fulfillment TEXT := input_data->>'fulfillment';
  input_sort_column TEXT := input_data->>'sortColumnAccessor';
  input_sort_direction TEXT := input_data->>'sortDirection';

  var_start INT := (input_page - 1) * input_records_per_page;
  var_total_count INT;
  var_records JSONB;
  var_order_number INT;

  return_data JSONB;
BEGIN
  IF input_search ~ '^\d+$' THEN
    var_order_number := input_search::INT;
  END IF;

  SELECT COUNT(*)
  INTO var_total_count
  FROM order_table
  INNER JOIN user_table
    ON user_id = order_user_id
  WHERE order_is_disabled = false
    AND (input_order_status = 'ALL' OR order_status = input_order_status::order_status)
    AND (input_payment_status = 'ALL' OR order_payment_status = input_payment_status::order_payment_status)
    AND (input_fulfillment = 'ALL' OR order_fulfillment = input_fulfillment::order_fulfillment)
    AND (
      input_search = '' OR (
        (var_order_number IS NOT NULL AND order_number = var_order_number)
        OR (user_first_name || ' ' || user_last_name) ILIKE '%' || input_search || '%'
        OR user_email ILIKE '%' || input_search || '%'
      )
    );
  SELECT JSONB_AGG(row_data)
  INTO var_records
  FROM (
    SELECT
      TO_JSONB(order_table.*) ||
      JSONB_BUILD_OBJECT(
        'order_user', user_table.*,
        'order_item_count', (
          SELECT COUNT(*)
          FROM order_item_table
          WHERE order_item_order_id = order_id
            AND order_item_is_disabled = false
        ),
        'order_total', (
          SELECT SUM(order_item_magic_collar_price)
          FROM order_item_table
          WHERE order_item_order_id = order_id
            AND order_item_is_disabled = false
        )
      ) AS row_data
    FROM order_table
    INNER JOIN user_table
      ON user_id = order_user_id
    WHERE order_is_disabled = false
      AND (input_order_status = 'ALL' OR order_status = input_order_status::order_status)
      AND (input_payment_status = 'ALL' OR order_payment_status = input_payment_status::order_payment_status)
      AND (input_fulfillment = 'ALL' OR order_fulfillment = input_fulfillment::order_fulfillment)
      AND (
        input_search = '' OR (
          (var_order_number IS NOT NULL AND order_number = var_order_number)
          OR (user_first_name || ' ' || user_last_name) ILIKE '%' || input_search || '%'
          OR user_email ILIKE '%' || input_search || '%'
        )
      )
    ORDER BY
      CASE WHEN input_sort_column = 'order_number'         AND input_sort_direction = 'asc'  THEN order_number END ASC,
      CASE WHEN input_sort_column = 'order_number'         AND input_sort_direction = 'desc' THEN order_number END DESC,
      CASE WHEN input_sort_column = 'order_date_created'   AND input_sort_direction = 'asc'  THEN order_date_created END ASC,
      CASE WHEN input_sort_column = 'order_date_created'   AND input_sort_direction = 'desc' THEN order_date_created END DESC,
      CASE WHEN input_sort_column = 'order_status'         AND input_sort_direction = 'asc'  THEN order_status END ASC,
      CASE WHEN input_sort_column = 'order_status'         AND input_sort_direction = 'desc' THEN order_status END DESC,
      CASE WHEN input_sort_column = 'order_payment_status' AND input_sort_direction = 'asc'  THEN order_payment_status END ASC,
      CASE WHEN input_sort_column = 'order_payment_status' AND input_sort_direction = 'desc' THEN order_payment_status END DESC,
      CASE WHEN input_sort_column = 'order_fulfillment'    AND input_sort_direction = 'asc'  THEN order_fulfillment END ASC,
      CASE WHEN input_sort_column = 'order_fulfillment'    AND input_sort_direction = 'desc' THEN order_fulfillment END DESC,
      order_number DESC
    LIMIT input_records_per_page
    OFFSET var_start
  ) AS subquery;

  return_data := JSONB_BUILD_OBJECT(
    'records', COALESCE(var_records, '[]'::JSONB),
    'totalRecords', COALESCE(var_total_count, 0)
  );

  RETURN return_data;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_admin_batches_page(input_data JSONB)
RETURNS JSONB
AS $$
DECLARE
  input_page INT := (input_data->>'page')::INT;
  input_records_per_page INT := (input_data->>'recordsPerPage')::INT;
  input_search TEXT := TRIM(REGEXP_REPLACE(input_data->>'search', '[%_]', '', 'g'));
  input_batch_status TEXT := input_data->>'batchStatus';
  input_sort_column TEXT := input_data->>'sortColumnAccessor';
  input_sort_direction TEXT := input_data->>'sortDirection';

  var_start INT := (input_page - 1) * input_records_per_page;
  var_total_count INT;
  var_records JSONB;
  var_batch_number INT;

  return_data JSONB;
BEGIN
  IF input_search ~ '^\d+$' THEN
    var_batch_number := input_search::INT;
  END IF;

  SELECT COUNT(*)
  INTO var_total_count
  FROM batch_table
  WHERE batch_is_disabled = false
    AND (input_batch_status = 'ALL' OR batch_status = input_batch_status::batch_status)
    AND (input_search = '' OR (var_batch_number IS NOT NULL AND batch_number = var_batch_number));

  SELECT JSONB_AGG(row_data)
  INTO var_records
  FROM (
    SELECT
      TO_JSONB(batch_table.*) ||
      JSONB_BUILD_OBJECT(
        'batch_order_quantity', (
          SELECT SUM(order_item_quantity)
          FROM order_item_table
          WHERE order_item_batch_id = batch_id
            AND order_item_is_disabled = false
        ),
        'batch_order_total', (
          SELECT SUM(order_item_price * order_item_quantity)
          FROM order_item_table
          WHERE order_item_batch_id = batch_id
            AND order_item_is_disabled = false
        )
      ) AS row_data
    FROM batch_table
    WHERE batch_is_disabled = false
      AND (input_batch_status = 'ALL' OR batch_status = input_batch_status::batch_status)
      AND (input_search = '' OR (var_batch_number IS NOT NULL AND batch_number = var_batch_number))
    ORDER BY
      CASE WHEN input_sort_column = 'batch_number' AND input_sort_direction = 'asc' THEN batch_number END ASC,
      CASE WHEN input_sort_column = 'batch_number' AND input_sort_direction = 'desc' THEN batch_number END DESC,
      CASE WHEN input_sort_column = 'batch_date_created' AND input_sort_direction = 'asc' THEN batch_date_created END ASC,
      CASE WHEN input_sort_column = 'batch_date_created' AND input_sort_direction = 'desc' THEN batch_date_created END DESC,
      CASE WHEN input_sort_column = 'batch_status' AND input_sort_direction = 'asc' THEN batch_status END ASC,
      CASE WHEN input_sort_column = 'batch_status' AND input_sort_direction = 'desc' THEN batch_status END DESC,
      batch_number DESC
    LIMIT input_records_per_page
    OFFSET var_start
  ) AS subquery;

  return_data := JSONB_BUILD_OBJECT(
    'records', COALESCE(var_records, '[]'::JSONB),
    'totalRecords', COALESCE(var_total_count, 0)
  );

  RETURN return_data;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION transition_batch_status(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_batch_id   UUID := (input_data->>'batchId')::UUID;
  input_next_status batch_status := (input_data->>'nextStatus')::batch_status;
  input_updated_by UUID := (input_data->>'updatedBy')::UUID;

  var_old_status batch_status;
BEGIN
  SELECT batch_status
  INTO var_old_status
  FROM batch_table
  WHERE batch_id = input_batch_id
    AND batch_is_disabled = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Batch % not found or is disabled', input_batch_id;
  END IF;

  -- Guard: reject if already on target status
  IF var_old_status = input_next_status THEN
    RAISE EXCEPTION 'Batch is already in status %', input_next_status;
  END IF;

  -- Update batch status + timestamp
  UPDATE batch_table
  SET
    batch_status = input_next_status,
    batch_date_updated = NOW()
  WHERE batch_id = input_batch_id;

  -- Insert audit log
  INSERT INTO batch_status_log_table (
    batch_status_log_old_status,
    batch_status_log_new_status,
    batch_status_log_batch_id,
    batch_status_log_updated_by
  ) VALUES (
    var_old_status,
    input_next_status,
    input_batch_id,
    input_updated_by
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_pending_payment_proofs(input_data JSONB)
RETURNS JSONB
AS $$
DECLARE
  input_page INTEGER := (input_data->>'page')::INTEGER;
  input_records_per_page INTEGER := (input_data->>'recordsPerPage')::INTEGER;

  var_start INTEGER;
  var_total INTEGER;
  
  return_data JSONB;
BEGIN
  var_start := (input_page - 1) * input_records_per_page;

  SELECT COUNT(*)
  INTO var_total
  FROM order_payment_table
  INNER JOIN order_table
    ON order_id = order_payment_order_id
  WHERE
    order_payment_request_status = 'PENDING'
    AND order_is_disabled = FALSE
    AND NOT EXISTS (
      SELECT 1 FROM order_item_table
      WHERE order_item_order_id = order_id
        AND order_item_is_disabled = TRUE
    );

  SELECT JSONB_BUILD_OBJECT(
    'records', COALESCE(JSONB_AGG(ROW_TO_JSON(record_data)), '[]'::JSONB),
    'totalRecords', var_total
  )
  INTO return_data
  FROM (
    SELECT
      order_payment_table.*,
      ROW_TO_JSON(attachment_table) AS order_payment_proof_attachment,
      ROW_TO_JSON(payment_channel_table) AS order_payment_payment_channel,
      TO_JSONB(order_table) || JSONB_BUILD_OBJECT(
        'order_user', ROW_TO_JSON(user_table),
        'order_total', COALESCE(
          (
            SELECT SUM(order_item_price * order_item_quantity)
            FROM order_item_table
            WHERE order_item_order_id = order_table.order_id
              AND order_item_is_disabled = FALSE
          ),
          0
        )
      ) AS order_payment_order
    FROM order_payment_table
    INNER JOIN attachment_table
      ON attachment_id = order_payment_proof_attachment_id
    INNER JOIN payment_channel_table
      ON payment_channel_id = order_payment_payment_channel_id
    INNER JOIN order_table
      ON order_id = order_payment_order_id
    INNER JOIN user_table
      ON user_id = order_user_id
    WHERE
      order_payment_request_status = 'PENDING'
      AND order_is_disabled = FALSE
      AND NOT EXISTS (
        SELECT 1 FROM order_item_table
        WHERE order_item_order_id = order_id
          AND order_item_is_disabled = TRUE
      )
    ORDER BY order_payment_date_created ASC
    LIMIT input_records_per_page
    OFFSET var_start
  ) record_data;

  RETURN return_data;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_order_paid_total(input_data JSONB)
RETURNS NUMERIC
AS $$
DECLARE
  input_order_id UUID := (input_data->>'orderId')::UUID;

  var_paid_price NUMERIC;
  var_down_payment NUMERIC;

  return_data NUMERIC;
BEGIN
  SELECT COALESCE(SUM(order_payment_amount), 0)
  INTO var_paid_price
  FROM order_payment_table
  WHERE order_payment_order_id = input_order_id
    AND order_payment_request_status = 'APPROVED';
  
  SELECT COALESCE(order_down_payment_amount - order_down_payment_fee, 0)
  INTO var_down_payment
  FROM order_table
  WHERE order_id = input_order_id;

  return_data = var_paid_price + var_down_payment;
  RETURN return_data;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reject_payment_proof(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_order_payment_id UUID := (input_data->>'orderPaymentId')::UUID;
  input_reason TEXT := input_data->>'reason';
  input_processed_by_user_id UUID := (input_data->>'processedByUserId')::UUID;
BEGIN
  UPDATE order_payment_table
  SET
    order_payment_request_status = 'REJECTED',
    order_payment_rejection_reason = input_reason,
    order_payment_amount = NULL,
    order_payment_transaction_id = NULL,
    order_payment_processed_by_admin_user_id = input_processed_by_user_id,
    order_payment_date_updated = NOW()
  WHERE order_payment_id = input_order_payment_id
    AND order_payment_request_status = 'PENDING';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION approve_payment_proof(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_order_payment_id UUID := (input_data->>'orderPaymentId')::UUID;
  input_transaction_id TEXT := input_data->>'transactionId';
  input_amount NUMERIC := (input_data->>'amount')::NUMERIC;
  input_processed_by_user_id UUID := (input_data->>'processedByUserId')::UUID;

  var_order_id UUID;
  var_order_total NUMERIC;
  var_paid_down_payment NUMERIC;
  var_approved_payment_total NUMERIC;
  var_paid_total NUMERIC;
  var_next_status order_payment_status;
BEGIN
  -- Approve the payment proof
  UPDATE order_payment_table
  SET
    order_payment_request_status = 'APPROVED',
    order_payment_transaction_id = input_transaction_id,
    order_payment_amount = input_amount,
    order_payment_rejection_reason = NULL,
    order_payment_processed_by_admin_user_id = input_processed_by_user_id,
    order_payment_date_updated = NOW()
  WHERE order_payment_id = input_order_payment_id
    AND order_payment_request_status = 'PENDING'
  RETURNING order_payment_order_id INTO var_order_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Compute order total from active items
  SELECT COALESCE(SUM(order_item_magic_collar_price * order_item_quantity), 0)
  INTO var_order_total
  FROM order_item_table
  WHERE order_item_order_id = var_order_id
    AND order_item_is_disabled = false;

  -- Compute paid down payment
  SELECT COALESCE(order_down_payment_amount - order_down_payment_fee, 0)
  INTO var_paid_down_payment
  FROM order_table
  WHERE order_id = var_order_id;

  -- Compute total approved payments
  SELECT COALESCE(SUM(order_payment_amount), 0)
  INTO var_approved_payment_total
  FROM order_payment_table
  WHERE order_payment_order_id = var_order_id
    AND order_payment_request_status = 'APPROVED';

  var_paid_total := var_paid_down_payment + var_approved_payment_total;

  -- Determine next payment status
  IF var_paid_total >= var_order_total THEN
    var_next_status := 'PAID';
  ELSIF var_paid_total > 0 THEN
    var_next_status := 'PARTIALLY_PAID';
  ELSE
    var_next_status := 'PENDING';
  END IF;

  -- Update order payment status
  UPDATE order_table
  SET
    order_payment_status = var_next_status,
    order_date_updated = NOW()
  WHERE order_id = var_order_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_admin_pickup_addresses_page(input_data JSONB)
RETURNS JSONB
AS $$
DECLARE
  input_page INT := COALESCE((input_data->>'page')::INT, 1);
  input_records_per_page INT := COALESCE((input_data->>'recordsPerPage')::INT, 10);
  input_search TEXT := COALESCE(NULLIF(TRIM(input_data->>'search'), ''), '');
  input_status BOOLEAN := (input_data->>'status')::BOOLEAN;
  input_sort_column TEXT := COALESCE(input_data->>'sortColumnAccessor', 'pickup_address_date_created');
  input_sort_direction TEXT := COALESCE(input_data->>'sortDirection', 'desc');

  var_ascending BOOLEAN := (input_sort_direction = 'asc');
  var_offset_count INT := (input_page - 1) * input_records_per_page;
  var_total_records INT;
  var_records JSONB;

  return_data JSONB;
BEGIN
  SELECT COUNT(*)
  INTO var_total_records
  FROM pickup_address_table
  INNER JOIN address_table
    ON address_id = pickup_address_address_id
  WHERE pickup_address_is_disabled = false
    AND (input_status IS NULL OR pickup_address_is_available = input_status)
    AND (
      input_search = '' OR
      LOWER(
        CONCAT_WS(', ',
          address_street,
          address_barangay,
          address_city,
          address_province,
          address_region,
          address_postal_code
        )
      ) LIKE '%' || LOWER(input_search) || '%'
    );

  SELECT COALESCE(JSONB_AGG(address_data), '[]'::JSONB)
  FROM (
    SELECT
      pickup_address_table.*,
      TO_JSONB(address_table.*) AS pickup_address
    FROM pickup_address_table
    INNER JOIN address_table
      ON address_id = pickup_address_address_id
    WHERE pickup_address_is_disabled = false
      AND (input_status IS NULL OR pickup_address_is_available = input_status)
      AND (
        input_search = '' OR
        LOWER(
          CONCAT_WS(', ',
            address_street,
            address_barangay,
            address_city,
            address_province,
            address_region,
            address_postal_code
          )
        ) LIKE '%%' || LOWER(input_search) || '%%'
      )
    ORDER BY
      CASE WHEN input_sort_column = 'pickup_address_date_created' AND var_ascending
        THEN pickup_address_date_created END ASC,
      CASE WHEN input_sort_column = 'pickup_address_date_created' AND NOT var_ascending
        THEN pickup_address_date_created END DESC
    LIMIT input_records_per_page OFFSET var_offset_count
  ) address_data
  INTO var_records;

  return_data = JSON_BUILD_OBJECT(
    'records', var_records,
    'totalRecords', var_total_records
  );

  RETURN return_data;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_pickup_address(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_address_insert JSONB = (input_data->'addressInsert')::JSONB;
  input_pickup_address_insert JSONB = (input_data->'pickupAddressInsert')::JSONB;

  var_address_id UUID;
BEGIN
  INSERT INTO address_table (
    address_street,
    address_barangay,
    address_city,
    address_province,
    address_region,
    address_postal_code
  )
  VALUES (
    input_address_insert->>'address_street',
    input_address_insert->>'address_barangay',
    input_address_insert->>'address_city',
    input_address_insert->>'address_province',
    input_address_insert->>'address_region',
    input_address_insert->>'address_postal_code'
  )
  RETURNING address_id INTO var_address_id;

  INSERT INTO pickup_address_table (
    pickup_address_address_id,
    pickup_address_latitude,
    pickup_address_longitude,
    pickup_address_is_available,
    pickup_address_created_by_admin_user_id
  )
  VALUES (
    var_address_id,
    (input_pickup_address_insert->>'pickup_address_latitude')::NUMERIC,
    (input_pickup_address_insert->>'pickup_address_longitude')::NUMERIC,
    COALESCE((input_pickup_address_insert->>'pickup_address_is_available')::BOOLEAN, true),
    (input_pickup_address_insert->>'pickup_address_created_by_admin_user_id')::UUID
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_pickup_address(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_pickup_address_id UUID := (input_data->>'pickupAddressId')::UUID;
  input_address_id UUID := (input_data->>'addressId')::UUID;
  input_address_patch JSONB := COALESCE(input_data->'addressUpdate', '{}'::JSONB);
  input_pickup_address_patch JSONB := COALESCE(input_data->'pickupAddressUpdate', '{}'::JSONB);
BEGIN
  UPDATE address_table
  SET
    address_street = COALESCE(input_address_patch->>'address_street', address_street),
    address_barangay = COALESCE(input_address_patch->>'address_barangay', address_barangay),
    address_city = COALESCE(input_address_patch->>'address_city', address_city),
    address_province = COALESCE(input_address_patch->>'address_province', address_province),
    address_region = COALESCE(input_address_patch->>'address_region', address_region),
    address_postal_code = COALESCE(input_address_patch->>'address_postal_code', address_postal_code)
  WHERE address_id = input_address_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Address % not found', input_address_id;
  END IF;

  UPDATE pickup_address_table
  SET
    pickup_address_latitude =
      COALESCE((input_pickup_address_patch->>'pickup_address_latitude')::NUMERIC, pickup_address_latitude),
    pickup_address_longitude =
      COALESCE((input_pickup_address_patch->>'pickup_address_longitude')::NUMERIC, pickup_address_longitude),
    pickup_address_is_available =
      COALESCE((input_pickup_address_patch->>'pickup_address_is_available')::BOOLEAN, pickup_address_is_available),
    pickup_address_updated_by_admin_user_id =
      COALESCE((input_pickup_address_patch->>'pickup_address_updated_by_admin_user_id')::UUID, pickup_address_updated_by_admin_user_id),
    pickup_address_date_updated =
      COALESCE((input_pickup_address_patch->>'pickup_address_date_updated')::TIMESTAMPTZ, NOW())
  WHERE pickup_address_id = input_pickup_address_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_address_id_based_on_label(input_data JSONB)
RETURNS JSONB
AS $$
DECLARE
  input_region TEXT := input_data->>'region';
  input_province TEXT := input_data->>'province';
  input_city TEXT := input_data->>'city';
  input_barangay TEXT := input_data->>'barangay';

  var_region_id UUID;
  var_province_id UUID;
  var_city_id UUID;
  var_barangay_id UUID;

  return_data JSONB;
BEGIN
  SELECT region_id
  INTO var_region_id
  FROM region_table
  WHERE region = input_region;

  SELECT province_id
  INTO var_province_id
  FROM province_table
  WHERE province = input_province;

  SELECT city_id
  INTO var_city_id
  FROM city_table
  WHERE city = input_city;

  SELECT barangay_id
  INTO var_barangay_id
  FROM barangay_table
  WHERE barangay = input_barangay;

  return_data = JSONB_BUILD_OBJECT(
    'regionId', COALESCE(var_region_id, NULL),
    'provinceId', COALESCE(var_province_id, NULL),
    'cityId', COALESCE(var_city_id, NULL),
    'barangayId', COALESCE(var_barangay_id, NULL)
  );
  RETURN return_data;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_pickup_address_availability(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_pickup_address_id UUID := (input_data->>'pickupAddressId')::UUID;
  input_is_available BOOLEAN := (input_data->>'isAvailable')::BOOLEAN;
  input_admin_user_id UUID := (input_data->>'adminUserId')::UUID;
BEGIN
  UPDATE pickup_address_table
  SET
    pickup_address_is_available = input_is_available,
    pickup_address_updated_by_admin_user_id = input_admin_user_id,
    pickup_address_date_updated = NOW()
  WHERE pickup_address_id = input_pickup_address_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_pickup_address(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_pickup_address_id UUID := (input_data->>'pickupAddressId')::UUID;
  input_admin_user_id UUID := (input_data->>'adminUserId')::UUID;
BEGIN
  UPDATE pickup_address_table
  SET
    pickup_address_is_disabled = true,
    pickup_address_updated_by_admin_user_id = input_admin_user_id,
    pickup_address_date_updated = NOW()
  WHERE pickup_address_id = input_pickup_address_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_admin_payment_channel_page(input_data JSONB)
RETURNS JSONB
AS $$
DECLARE
  input_page INT := COALESCE((input_data->>'page')::INT, 1);
  input_records_per_page INT := COALESCE((input_data->>'recordsPerPage')::INT, 10);
  input_search TEXT := COALESCE(NULLIF(TRIM(input_data->>'search'), ''), '');
  input_status BOOLEAN := (input_data->>'status')::BOOLEAN;
  input_sort_column TEXT := COALESCE(input_data->>'sortColumnAccessor', 'payment_channel_date_created');
  input_sort_direction TEXT := COALESCE(input_data->>'sortDirection', 'desc');

  var_ascending BOOLEAN := (input_sort_direction = 'asc');
  var_offset_count INT := (input_page - 1) * input_records_per_page;
  var_total_records INT;
  var_records JSONB;

  return_data JSONB;
BEGIN
  SELECT COUNT(*)
  INTO var_total_records
  FROM payment_channel_table
  WHERE payment_channel_is_disabled = false
    AND (input_status IS NULL OR payment_channel_is_available = input_status)
    AND (
      input_search = '' OR
      LOWER(payment_channel_provider_name) LIKE '%' || LOWER(input_search) || '%' OR
      LOWER(payment_channel_account_name) LIKE '%' || LOWER(input_search) || '%' OR
      LOWER(payment_channel_account_identifier) LIKE '%' || LOWER(input_search) || '%'
    );

  SELECT COALESCE(JSONB_AGG(payment_data), '[]'::JSONB)
  FROM (
    SELECT
      payment_channel_table.*,
      TO_JSONB(attachment_table.*) AS payment_channel_qr_code_attachment
    FROM payment_channel_table
    INNER JOIN attachment_table
      ON payment_channel_qr_code_attachment_id = attachment_id
    WHERE payment_channel_is_disabled = false
      AND (input_status IS NULL OR payment_channel_is_available = input_status)
      AND (
        input_search = '' OR
        LOWER(payment_channel_provider_name) LIKE '%' || LOWER(input_search) || '%' OR
        LOWER(payment_channel_account_name) LIKE '%' || LOWER(input_search) || '%' OR
        LOWER(payment_channel_account_identifier) LIKE '%' || LOWER(input_search) || '%'
      )
    ORDER BY
      CASE WHEN input_sort_column = 'payment_channel_date_created' AND var_ascending
        THEN payment_channel_date_created END ASC,
      CASE WHEN input_sort_column = 'payment_channel_date_created' AND NOT var_ascending
        THEN payment_channel_date_created END DESC
    LIMIT input_records_per_page OFFSET var_offset_count
  ) payment_data
  INTO var_records;

  return_data = JSON_BUILD_OBJECT(
    'records', var_records,
    'totalRecords', var_total_records
  );

  RETURN return_data;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_payment_channel_availability(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_payment_channel_id UUID := (input_data->>'paymentChannelId')::UUID;
  input_is_available BOOLEAN := (input_data->>'isAvailable')::BOOLEAN;
  input_admin_user_id UUID := (input_data->>'adminUserId')::UUID;
BEGIN
  UPDATE payment_channel_table
  SET
    payment_channel_is_available = input_is_available,
    payment_channel_updated_by_admin_user_id = input_admin_user_id,
    payment_channel_date_updated = NOW()
  WHERE payment_channel_id = input_payment_channel_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_payment_channel(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_payment_channel_id UUID := (input_data->>'paymentChannelId')::UUID;
  input_admin_user_id UUID := (input_data->>'adminUserId')::UUID;
BEGIN
  UPDATE payment_channel_table
  SET
    payment_channel_is_disabled = true,
    payment_channel_updated_by_admin_user_id = input_admin_user_id,
    payment_channel_date_updated = NOW()
  WHERE payment_channel_id = input_payment_channel_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_payment_channel(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_attachment_insert JSONB = (input_data->'attachmentInsert')::JSONB;
  input_payment_channel_insert JSONB = (input_data->'paymentChannelInsert')::JSONB;

  var_attachment_id UUID;
BEGIN
  INSERT INTO attachment_table (
    attachment_name,
    attachment_path,
    attachment_bucket,
    attachment_mime_type,
    attachment_size
  ) VALUES (
    (input_attachment_insert->>'attachment_name'),
    (input_attachment_insert->>'attachment_path'),
    (input_attachment_insert->>'attachment_bucket'),
    (input_attachment_insert->>'attachment_mime_type'),
    (input_attachment_insert->>'attachment_size')::BIGINT
  )
  RETURNING attachment_id
  INTO var_attachment_id;

  INSERT INTO payment_channel_table (
    payment_channel_is_available,
    payment_channel_provider_name,
    payment_channel_account_name,
    payment_channel_account_identifier,
    payment_channel_qr_code_attachment_id,
    payment_channel_created_by_admin_user_id
  )
  VALUES (
    (input_payment_channel_insert->>'payment_channel_is_available')::BOOLEAN,
    (input_payment_channel_insert->>'payment_channel_provider_name'),
    (input_payment_channel_insert->>'payment_channel_account_name'),
    (input_payment_channel_insert->>'payment_channel_account_identifier'),
    var_attachment_id,
    (input_payment_channel_insert->>'payment_channel_created_by_admin_user_id')::UUID
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_payment_channel(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_payment_channel_id UUID := (input_data->>'paymentChannelId')::UUID;
  input_attachment_id UUID := (input_data->>'attachmentId')::UUID;
  input_attachment_data JSONB := COALESCE(input_data->'attachmentData', '{}'::JSONB);
  input_payment_channel_update JSONB := COALESCE(input_data->'paymentChannelUpdate', '{}'::JSONB);

  var_attachment_id UUID;
BEGIN
  IF input_attachment_data IS NOT NULL THEN
    INSERT INTO attachment_table (
      attachment_name,
      attachment_path,
      attachment_bucket,
      attachment_mime_type,
      attachment_size
    ) VALUES (
      (input_attachment_data->>'attachment_name'),
      (input_attachment_data->>'attachment_path'),
      (input_attachment_data->>'attachment_bucket'),
      (input_attachment_data->>'attachment_mime_type'),
      (input_attachment_data->>'attachment_size')::BIGINT
    )
    RETURNING attachment_id
    INTO var_attachment_id;

    DELETE
    FROM attachment_table
    WHERE attachment_id = input_attachment_id;
  END IF;

  UPDATE payment_channel_table
  SET
    payment_channel_provider_name =
      COALESCE((input_payment_channel_update->>'payment_channel_provider_name'), payment_channel_provider_name),
    payment_channel_account_name =
      COALESCE((input_payment_channel_update->>'payment_channel_account_name'), payment_channel_account_name),
    payment_channel_account_identifier =
      COALESCE((input_payment_channel_update->>'payment_channel_account_identifier'), payment_channel_account_identifier),
    payment_channel_is_available =
      COALESCE((input_payment_channel_update->>'payment_channel_is_available')::BOOLEAN, payment_channel_is_available),
    payment_channel_updated_by_admin_user_id =
      COALESCE((input_payment_channel_update->>'payment_channel_updated_by_admin_user_id')::UUID, payment_channel_updated_by_admin_user_id),
    payment_channel_date_updated =
      COALESCE((input_payment_channel_update->>'payment_channel_date_updated')::TIMESTAMPTZ, NOW()),
    payment_channel_qr_code_attachment_id =
      COALESCE(var_attachment_id, input_attachment_id)
  WHERE payment_channel_id = input_payment_channel_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_admin_couriers_page(input_data JSONB)
RETURNS JSONB
AS $$
DECLARE
  input_page INT := COALESCE((input_data->>'page')::INT, 1);
  input_records_per_page INT := COALESCE((input_data->>'recordsPerPage')::INT, 10);
  input_search TEXT := COALESCE(NULLIF(TRIM(input_data->>'search'), ''), '');
  input_status BOOLEAN := (input_data->>'status')::BOOLEAN;
  input_sort_column TEXT := COALESCE(input_data->>'sortColumnAccessor', 'courier_date_created');
  input_sort_direction TEXT := COALESCE(input_data->>'sortDirection', 'desc');

  var_ascending BOOLEAN := (input_sort_direction = 'asc');
  var_offset_count INT := (input_page - 1) * input_records_per_page;
  var_total_records INT;
  var_records JSONB;

  return_data JSONB;
BEGIN
  SELECT COUNT(*)
  INTO var_total_records
  FROM courier_table
  WHERE courier_is_disabled = false
    AND (input_status IS NULL OR courier_is_available = input_status)
    AND (input_search = '' OR LOWER(courier_name) LIKE '%' || LOWER(input_search) || '%');

  SELECT COALESCE(JSONB_AGG(courier_data), '[]'::JSONB)
  INTO var_records
  FROM (
    SELECT *
    FROM courier_table
    WHERE courier_is_disabled = false
      AND (input_status IS NULL OR courier_is_available = input_status)
      AND (input_search = '' OR LOWER(courier_name) LIKE '%' || LOWER(input_search) || '%')
    ORDER BY
      CASE WHEN input_sort_column = 'courier_date_created' AND var_ascending
        THEN courier_date_created END ASC NULLS LAST,
      CASE WHEN input_sort_column = 'courier_date_created' AND NOT var_ascending
        THEN courier_date_created END DESC NULLS LAST
    LIMIT input_records_per_page OFFSET var_offset_count
  ) courier_data;

  return_data := JSONB_BUILD_OBJECT(
    'records', var_records,
    'totalRecords', var_total_records
  );

  RETURN return_data;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_courier(input_data JSONB)
RETURNS JSONB
AS $$
DECLARE
  var_courier_id UUID;
BEGIN
  INSERT INTO courier_table (
    courier_name,
    courier_is_available,
    courier_created_by_admin_user_id
  )
  VALUES (
    input_data->'courierInsert'->>'courier_name',
    COALESCE((input_data->'courierInsert'->>'courier_is_available')::BOOLEAN, true),
    (input_data->'courierInsert'->>'courier_created_by_admin_user_id')::UUID
  )
  RETURNING courier_id INTO var_courier_id;

  RETURN JSONB_BUILD_OBJECT('courierId', var_courier_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_courier(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_courier_id UUID := (input_data->>'courierId')::UUID;
  patch JSONB := COALESCE(input_data->'courierUpdate', '{}'::JSONB);
BEGIN
  UPDATE courier_table
  SET
    courier_name = COALESCE(patch->>'courier_name', courier_name),
    courier_is_available =
      COALESCE((patch->>'courier_is_available')::BOOLEAN, courier_is_available),
    courier_updated_by_admin_user_id =
      COALESCE((patch->>'courier_updated_by_admin_user_id')::UUID, courier_updated_by_admin_user_id),
    courier_date_updated = NOW()
  WHERE courier_id = input_courier_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_courier_availability(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_courier_id UUID := (input_data->>'courierId')::UUID;
  input_is_available BOOLEAN := (input_data->>'isAvailable')::BOOLEAN;
  input_admin_user_id UUID := (input_data->>'adminUserId')::UUID;
BEGIN
  UPDATE courier_table
  SET
    courier_is_available = input_is_available,
    courier_updated_by_admin_user_id = input_admin_user_id,
    courier_date_updated = NOW()
  WHERE courier_id = input_courier_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_courier(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_courier_id UUID := (input_data->>'courierId')::UUID;
  input_admin_user_id UUID := (input_data->>'adminUserId')::UUID;
BEGIN
  UPDATE courier_table
  SET
    courier_is_disabled = true,
    courier_updated_by_admin_user_id = input_admin_user_id,
    courier_date_updated = NOW()
  WHERE courier_id = input_courier_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_settings(input_data JSONB)
RETURNS VOID
AS $$
DECLARE
  input_updates JSONB := input_data->'updates';
  input_admin_user_id UUID := (input_data->>'adminUserId')::UUID;
BEGIN
  UPDATE system_setting_table
  SET
    system_setting_value = u.value,
    system_setting_updated_by_admin_user_id = input_admin_user_id,
    system_setting_date_updated = NOW()
  FROM JSONB_TO_RECORDSET(input_updates) AS u(key settings, value TEXT)
  WHERE system_setting_key = u.key;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fetch_top_items(input_data JSONB)
RETURNS JSONB
AS $$
DECLARE
  input_number_of_item INT := (input_data->>'numberOfItem')::INT;
  return_data JSONB;
BEGIN
  WITH car_data AS (
    SELECT
      car_table.car_id,
      SUM(order_item_quantity) AS order_count
    FROM car_table
    LEFT JOIN order_item_table
      ON order_item_car_id = car_id
      AND order_item_is_disabled = false
    WHERE car_is_disabled = false
      AND car_is_available = true
    GROUP BY car_id
    ORDER BY order_count DESC NULLS LAST, car_date_created DESC
    LIMIT input_number_of_item
  )
  SELECT COALESCE(
    JSONB_AGG(
      TO_JSONB(car_table.*) || JSONB_BUILD_OBJECT(
        'car_make', make,
        'car_model', model,
        'car_order_count', order_count,
        'car_magic_collar', TO_JSONB(magic_collar_table.*),
        'car_image_attachment', TO_JSONB(attachment_table.*)
      )
      ORDER BY order_count DESC NULLS LAST
    ),
    '[]'::JSONB
  )
  INTO return_data
  FROM car_data
  INNER JOIN car_table
    ON car_table.car_id = car_data.car_id
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
    AND attachment_is_disabled = false;

  RETURN return_data;
END;
$$ LANGUAGE plpgsql;