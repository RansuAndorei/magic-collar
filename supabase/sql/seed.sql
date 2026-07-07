INSERT INTO user_table (user_id, user_first_name, user_last_name, user_email, user_phone_number, user_role) VALUES
('8b9f19a9-c39a-4138-929e-1402f76701fa', 'Magic Collar', 'Admin', 'admin@gmail.com', '9123456789', 'ADMIN'),
('10f105ed-b0fb-4031-951b-2e0ec6956c15', 'Lance Andrei', 'Juat', 'lancejuat26@gmail.com', '9358171232', 'CUSTOMER');

INSERT INTO attachment_table ("attachment_id", "attachment_name", "attachment_path", "attachment_bucket") VALUES
('1a0f3e82-3e2f-47e3-95f4-93cd0daaf38c', 'car placeholder', 'https://qdeexfjtzydxkfsdgodx.supabase.co/storage/v1/object/public/CARS/car-placeholder.png', 'CARS'),
('8b656dc5-75b9-401d-9ce7-022263d08fce', 'GCash', 'https://qdeexfjtzydxkfsdgodx.supabase.co/storage/v1/object/public/PAYMENT_CHANNEL_QR/GCash.jpg', 'PAYMENT_CHANNEL_QR'),
('25379acd-a631-4487-b31f-b2ec2f8bd571', 'GoTyme', 'https://qdeexfjtzydxkfsdgodx.supabase.co/storage/v1/object/public/PAYMENT_CHANNEL_QR/GoTyme.jpg', 'PAYMENT_CHANNEL_QR'),
('8c6f9cad-f304-4878-8d3d-bb2d25b90ade', 'MariBank', 'https://qdeexfjtzydxkfsdgodx.supabase.co/storage/v1/object/public/PAYMENT_CHANNEL_QR/MariBank.jpg', 'PAYMENT_CHANNEL_QR'),
('6034fe98-ff03-4d20-a1a6-5d599ea8c52d', 'Maya', 'https://qdeexfjtzydxkfsdgodx.supabase.co/storage/v1/object/public/PAYMENT_CHANNEL_QR/Maya.jpg', 'PAYMENT_CHANNEL_QR'),
('81f682f0-18b6-4632-afae-39729c0345e9', 'RCBC', 'https://qdeexfjtzydxkfsdgodx.supabase.co/storage/v1/object/public/PAYMENT_CHANNEL_QR/RCBC.jpg', 'PAYMENT_CHANNEL_QR');

INSERT INTO address_table (address_id, address_region, address_province, address_city, address_barangay, address_street, address_postal_code) VALUES
('d008fb70-6d22-4c93-aa3e-ceef4fd7e5a7', 'National Capital Region (NCR)', 'NCR, Second District', 'Quezon City', 'U.P. Village', '63 Maginhawa', '1101'),
('aed7b8eb-4058-4258-b6dc-872c337f8b6b', 'Region III - Central Luzon', 'Bulacan', 'Obando', 'Paliwas', 'J.P. Rizal', '3021'),
('817646bc-5303-495c-b801-a58e2f81c747', 'Region VIII - Eastern Visayas', 'Samar (Western Samar)', 'Pagsanghan', 'Bangon', 'Biringan', '6705'),
('3c2106bd-d40a-4333-b734-46d7a40f5086', 'National Capital Region (NCR)', 'NCR, City of Manila, First District', 'Ermita', 'Barangay 659', 'San Marcelino', '1000');

INSERT INTO delivery_detail_table (delivery_detail_id, delivery_detail_full_name, delivery_detail_phone_number, delivery_detail_address_id, delivery_detail_user_id, delivery_detail_is_default) VALUES
('8045101a-c52d-440b-bf89-4458d822874d', 'Lance Andrei Rivera Juat', '9358171232', 'aed7b8eb-4058-4258-b6dc-872c337f8b6b', '10f105ed-b0fb-4031-951b-2e0ec6956c15', true),
('a3081bb5-3303-4b57-be44-4544045c5720', 'Puto', '9548979456', '3c2106bd-d40a-4333-b734-46d7a40f5086', '10f105ed-b0fb-4031-951b-2e0ec6956c15', false);

INSERT INTO pickup_address_table (pickup_address_latitude, pickup_address_longitude, pickup_address_address_id, pickup_address_created_by_admin_user_id, pickup_address_is_available) VALUES
(14.64807896736001, 121.05740116065856, 'd008fb70-6d22-4c93-aa3e-ceef4fd7e5a7', '8b9f19a9-c39a-4138-929e-1402f76701fa', true),
(11.969570249971897, 124.76092996295085, '817646bc-5303-495c-b801-a58e2f81c747', '8b9f19a9-c39a-4138-929e-1402f76701fa', false);

INSERT INTO system_setting_table (system_setting_key, system_setting_value) VALUES
('BATCH_LIMIT', 32),
('ORDER_EXPIRATION_IN_DAYS', 30),
('EMAIL', 'magiccollar@gmail.com'),
('PHONE_NUMBER', '9123456789'),
('MESSENGER', 'https://www.m.me/MagicCollarPH'),
('FACEBOOK', 'https://www.facebook.com/MagicCollarPH'),
('TIKTOK', 'https://www.tiktok.com/discover/magic-collar-car'),
('YOUTUBE', 'https://www.youtube.com/results?search_query=magic+collar');

INSERT INTO batch_table (batch_id) VALUES
('120c2e73-3905-4189-b1e1-358f15b6c50b');

INSERT INTO batch_status_log_table (batch_status_log_new_status, batch_status_log_batch_id) VALUES
('PENDING', '120c2e73-3905-4189-b1e1-358f15b6c50b');

INSERT INTO payment_channel_table (payment_channel_provider_name, payment_channel_account_name, payment_channel_account_identifier, payment_channel_qr_code_attachment_id, payment_channel_created_by_admin_user_id) VALUES
('GCash', 'Lance Juat', '09762557106', '8b656dc5-75b9-401d-9ce7-022263d08fce', '8b9f19a9-c39a-4138-929e-1402f76701fa'),
('GoTyme', 'Lance Juat', '013726831806', '25379acd-a631-4487-b31f-b2ec2f8bd571', '8b9f19a9-c39a-4138-929e-1402f76701fa'),
('MariBank', 'Lance Juat', '1124 8397 114', '8c6f9cad-f304-4878-8d3d-bb2d25b90ade', '8b9f19a9-c39a-4138-929e-1402f76701fa'),
('Maya', 'Lance Juat', '09358171232', '6034fe98-ff03-4d20-a1a6-5d599ea8c52d', '8b9f19a9-c39a-4138-929e-1402f76701fa'),
('RCBC', 'Lance Juat', '0000 0090 3990 4581', '81f682f0-18b6-4632-afae-39729c0345e9', '8b9f19a9-c39a-4138-929e-1402f76701fa');

INSERT INTO courier_table (courier_name, courier_created_by_admin_user_id) VALUES
('LBC', '8b9f19a9-c39a-4138-929e-1402f76701fa'),
('Lalamove', '8b9f19a9-c39a-4138-929e-1402f76701fa');