-- HANCR — Services seed (3 services لكل region)
DELETE FROM hancr_service WHERE name_en IN ('Economy','Comfort','XL');

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM hancr_region LOOP
    INSERT INTO hancr_service (name,name_en,service_type,base_fare,per_hundred_meters,per_minute_drive,per_minute_wait,minimum_fee,provider_share_percent,prepay_percent,cancellation_total_fee,cancellation_driver_share,time_multipliers,weekday_multipliers,date_range_multipliers,search_radius,bid_mode_enabled,enabled,display_order,is_vip,region_id)
    VALUES
    ('اقتصادي','Economy','Ride',5.0,0.5,0.3,0.1,8.0,15.0,0.0,5.0,3.0,'{}','{}','{}',3000,false,true,1,false,r.id),
    ('مريح','Comfort','Ride',8.0,0.7,0.4,0.15,12.0,15.0,0.0,7.0,4.0,'{}','{}','{}',3000,false,true,2,false,r.id),
    ('عائلي XL','XL','Ride',12.0,0.9,0.5,0.2,18.0,15.0,0.0,10.0,5.0,'{}','{}','{}',4000,false,true,3,true,r.id);
  END LOOP;
END $$;

SELECT region_id, id, name_en, base_fare, minimum_fee FROM hancr_service ORDER BY region_id, display_order;
