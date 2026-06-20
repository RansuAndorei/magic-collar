INSERT INTO user_table (user_id, user_first_name, user_last_name, user_email, user_phone_number, user_role)
VALUES ('8b9f19a9-c39a-4138-929e-1402f76701fa', 'Magic Collar', 'Admin', 'admin@gmail.com', '9123456789', 'ADMIN');

INSERT INTO attachment_table ("attachment_id", "attachment_name", "attachment_path", "attachment_bucket") VALUES
('1a0f3e82-3e2f-47e3-95f4-93cd0daaf38c', 'car placeholder', 'https://qdeexfjtzydxkfsdgodx.supabase.co/storage/v1/object/public/CARS/car-placeholder.png', 'CARS'),
('8050bda8-52ed-4e97-9e08-94fe04c1b01d', 'bpi qr code', 'https://qdeexfjtzydxkfsdgodx.supabase.co/storage/v1/object/public/PAYMENT_CHANNEL_QR/bpi.jpg', 'PAYMENT_CHANNEL_QR'),
('1a05c7f6-7893-4f49-a603-46d3bdcc934e', 'gcash qr code', 'https://qdeexfjtzydxkfsdgodx.supabase.co/storage/v1/object/public/PAYMENT_CHANNEL_QR/gcash.png', 'PAYMENT_CHANNEL_QR');

INSERT INTO system_setting_table (system_setting_key, system_setting_value) VALUES
('BATCH_LIMIT', 32);

INSERT INTO batch_table (batch_id) VALUES
('120c2e73-3905-4189-b1e1-358f15b6c50b');

INSERT INTO batch_status_log_table (batch_status_log_new_status, batch_status_log_batch_id) VALUES
('PENDING', '120c2e73-3905-4189-b1e1-358f15b6c50b');

INSERT INTO payment_channel_table (payment_channel_provider_name, payment_channel_account_name, payment_channel_account_identifier, payment_channel_qr_code_attachment_id) VALUES
('BPI', 'BPI Account', '0123456789', '8050bda8-52ed-4e97-9e08-94fe04c1b01d'),
('GCash', 'GCash Account', '09123456789', '1a05c7f6-7893-4f49-a603-46d3bdcc934e');