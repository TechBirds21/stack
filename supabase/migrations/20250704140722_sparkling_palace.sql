/*
  # Add Dummy Data for Testing

  1. Sample Users
    - Buyers, sellers, and agents with different profiles
  
  2. Sample Properties
    - Various property types for sale and rent
    - Different locations and price ranges
  
  3. Sample Bookings and Inquiries
    - Test data for user interactions
*/

-- Insert sample users (buyers, sellers, agents)
INSERT INTO users (id, email, first_name, last_name, phone_number, user_type, status, verification_status, date_of_birth) VALUES
-- Buyers
('11111111-1111-1111-1111-111111111111', 'buyer1@example.com', 'John', 'Smith', '+91 9876543210', 'buyer', 'active', 'verified', '1990-05-15'),
('22222222-2222-2222-2222-222222222222', 'buyer2@example.com', 'Sarah', 'Johnson', '+91 9876543211', 'buyer', 'active', 'verified', '1985-08-22'),
('33333333-3333-3333-3333-333333333333', 'buyer3@example.com', 'Mike', 'Davis', '+91 9876543212', 'buyer', 'active', 'pending', '1992-12-10'),

-- Sellers
('44444444-4444-4444-4444-444444444444', 'seller1@example.com', 'Priya', 'Sharma', '+91 9876543213', 'seller', 'active', 'verified', '1980-03-18'),
('55555555-5555-5555-5555-555555555555', 'seller2@example.com', 'Rajesh', 'Kumar', '+91 9876543214', 'seller', 'active', 'verified', '1975-11-25'),
('66666666-6666-6666-6666-666666666666', 'seller3@example.com', 'Anita', 'Patel', '+91 9876543215', 'seller', 'active', 'verified', '1988-07-03'),

-- Agents
('77777777-7777-7777-7777-777777777777', 'agent1@example.com', 'Vikram', 'Singh', '+91 9876543216', 'agent', 'active', 'verified', '1982-09-14'),
('88888888-8888-8888-8888-888888888888', 'agent2@example.com', 'Meera', 'Reddy', '+91 9876543217', 'agent', 'active', 'verified', '1987-01-30'),
('99999999-9999-9999-9999-999999999999', 'agent3@example.com', 'Arjun', 'Nair', '+91 9876543218', 'agent', 'active', 'pending', '1990-06-12');

-- Insert more diverse properties
INSERT INTO properties (
  id, title, description, price, monthly_rent, security_deposit, property_type, 
  bedrooms, bathrooms, area_sqft, address, city, state, zip_code,
  latitude, longitude, images, amenities, owner_id, status, featured, verified, listing_type,
  available_from, furnishing_status
) VALUES 

-- Properties for Sale
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Luxury 4BHK Penthouse with Sea View', 'Stunning penthouse with panoramic sea views, premium finishes, and private terrace.', 15000000, NULL, NULL, 'penthouse', 4, 4, 3500, 'Beach Road', 'Visakhapatnam', 'Andhra Pradesh', '530002', 17.7231, 83.3012, ARRAY['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg', 'https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'], ARRAY['Sea View', 'Private Terrace', 'Premium Finishes', 'Elevator', 'Security'], '44444444-4444-4444-4444-444444444444', 'active', true, true, 'SALE', NULL, 'Fully Furnished'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Spacious 3BHK Independent House', 'Well-maintained independent house with garden, parking, and modern amenities.', 7500000, NULL, NULL, 'house', 3, 3, 2200, 'Madhurawada', 'Visakhapatnam', 'Andhra Pradesh', '530048', 17.7626, 83.3731, ARRAY['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg', 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg'], ARRAY['Garden', 'Parking', 'Independent', 'Vastu Compliant'], '55555555-5555-5555-5555-555555555555', 'active', true, true, 'SALE', NULL, 'Semi Furnished'),

('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Modern 2BHK Apartment in IT Hub', 'Contemporary apartment in prime IT corridor with excellent connectivity.', 4200000, NULL, NULL, 'apartment', 2, 2, 1150, 'Gachibowli', 'Hyderabad', 'Telangana', '500032', 17.4399, 78.3908, ARRAY['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'], ARRAY['IT Hub Location', 'Metro Connectivity', 'Gym', 'Swimming Pool'], '66666666-6666-6666-6666-666666666666', 'active', false, true, 'SALE', NULL, 'Unfurnished'),

-- Properties for Rent
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Fully Furnished 1BHK Studio', 'Compact and stylish studio apartment perfect for working professionals.', NULL, 22000, 44000, 'studio', 1, 1, 650, 'Banjara Hills', 'Hyderabad', 'Telangana', '500034', 17.4126, 78.4482, ARRAY['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'], ARRAY['Fully Furnished', 'WiFi', 'AC', 'Washing Machine'], '44444444-4444-4444-4444-444444444444', 'active', true, true, 'RENT', '2024-02-01', 'Fully Furnished'),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Premium 3BHK Flat with Amenities', 'Spacious flat in gated community with world-class amenities and security.', NULL, 45000, 90000, 'apartment', 3, 3, 1800, 'Jubilee Hills', 'Hyderabad', 'Telangana', '500033', 17.4239, 78.4738, ARRAY['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg'], ARRAY['Gated Community', 'Swimming Pool', 'Gym', 'Clubhouse', '24/7 Security'], '55555555-5555-5555-5555-555555555555', 'active', true, true, 'RENT', '2024-01-15', 'Semi Furnished'),

('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Cozy 2BHK Near Beach', 'Comfortable apartment just 5 minutes walk from the beach with sea breeze.', NULL, 28000, 56000, 'apartment', 2, 2, 1000, 'RK Beach Road', 'Visakhapatnam', 'Andhra Pradesh', '530003', 17.7231, 83.3012, ARRAY['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'], ARRAY['Near Beach', 'Sea Breeze', 'Balcony', 'Parking'], '66666666-6666-6666-6666-666666666666', 'active', false, true, 'RENT', '2024-02-15', 'Semi Furnished'),

-- More properties in different cities
('gggggggg-gggg-gggg-gggg-gggggggggggg', 'Luxury Villa in Gated Community', 'Premium villa with private pool, garden, and 24/7 security in exclusive community.', 12000000, NULL, NULL, 'villa', 4, 4, 3000, 'Kondapur', 'Hyderabad', 'Telangana', '500084', 17.4615, 78.3657, ARRAY['https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg'], ARRAY['Private Pool', 'Garden', 'Gated Community', 'Security', 'Clubhouse'], '44444444-4444-4444-4444-444444444444', 'active', true, true, 'SALE', NULL, 'Fully Furnished'),

('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'Budget-Friendly 1BHK Apartment', 'Affordable apartment perfect for first-time buyers or investment.', 2800000, NULL, NULL, 'apartment', 1, 1, 750, 'Kukatpally', 'Hyderabad', 'Telangana', '500072', 17.4840, 78.4071, ARRAY['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'], ARRAY['Affordable', 'Good Connectivity', 'Parking', 'Lift'], '55555555-5555-5555-5555-555555555555', 'active', false, true, 'SALE', NULL, 'Unfurnished'),

('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'Spacious Family Home for Rent', 'Large family home with garden, perfect for families with children.', NULL, 38000, 76000, 'house', 3, 3, 2000, 'Miyapur', 'Hyderabad', 'Telangana', '500049', 17.4948, 78.3563, ARRAY['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg'], ARRAY['Family Friendly', 'Garden', 'Parking', 'Good Schools Nearby'], '66666666-6666-6666-6666-666666666666', 'active', false, true, 'RENT', '2024-03-01', 'Semi Furnished');

-- Insert sample bookings
INSERT INTO bookings (property_id, user_id, booking_date, booking_time, status, notes) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '2024-01-25', '10:00:00', 'confirmed', 'Interested in the sea view penthouse'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '2024-01-26', '14:30:00', 'pending', 'Looking for a family home'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', '2024-01-27', '11:00:00', 'confirmed', 'Need furnished studio for work'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', '2024-01-28', '16:00:00', 'pending', 'Checking amenities'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '22222222-2222-2222-2222-222222222222', '2024-01-29', '09:30:00', 'confirmed', 'Love the beach location');

-- Insert sample inquiries
INSERT INTO inquiries (property_id, user_id, name, email, phone, message, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'John Smith', 'buyer1@example.com', '+91 9876543210', 'Very interested in this penthouse. Can we negotiate on the price?', 'new'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Sarah Johnson', 'buyer2@example.com', '+91 9876543211', 'Is the house ready for immediate possession? We are looking to move in next month.', 'responded'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Mike Davis', 'buyer3@example.com', '+91 9876543212', 'What are the maintenance charges? Is car parking included?', 'new'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'John Smith', 'buyer1@example.com', '+91 9876543210', 'Is the studio available from February 1st? I work in IT and need good internet.', 'new'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'Sarah Johnson', 'buyer2@example.com', '+91 9876543211', 'Beautiful apartment! Are pets allowed? We have a small dog.', 'responded'),

-- Anonymous inquiries (from non-registered users)
('ffffffff-ffff-ffff-ffff-ffffffffffff', NULL, 'Rahul Gupta', 'rahul.gupta@email.com', '+91 9876543219', 'Hi, I am interested in this beach-side apartment. Can you share more details about the lease terms?', 'new'),
('gggggggg-gggg-gggg-gggg-gggggggggggg', NULL, 'Sneha Iyer', 'sneha.iyer@email.com', '+91 9876543220', 'Interested in the luxury villa. Is home loan assistance available?', 'new'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', NULL, 'Amit Verma', 'amit.verma@email.com', '+91 9876543221', 'Looking for a budget apartment for investment. Is this a good option?', 'responded');