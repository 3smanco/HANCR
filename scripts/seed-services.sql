-- HANCR — Services seed (RideSharing + PackageDelivery + HourlyChauffeur لكل region)
DELETE FROM hancr_service WHERE name_en IN ('Economy','Comfort','XL','Parcel','Hourly');

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM hancr_region LOOP
    -- مشاوير عادية
    INSERT INTO hancr_service (name,name_en,service_type,base_fare,per_hundred_meters,per_minute_drive,per_minute_wait,minimum_fee,provider_share_percent,prepay_percent,cancellation_total_fee,cancellation_driver_share,time_multipliers,weekday_multipliers,date_range_multipliers,search_radius,bid_mode_enabled,enabled,display_order,is_vip,region_id)
    VALUES
    ('اقتصادي','Economy','RideSharing',5.0,0.5,0.3,0.1,8.0,15.0,0.0,5.0,3.0,'[]','[]','[]',3000,true,true,1,false,r.id),
    ('مريح','Comfort','RideSharing',8.0,0.7,0.4,0.15,12.0,15.0,0.0,7.0,4.0,'[]','[]','[]',3000,true,true,2,false,r.id),
    ('عائلي XL','XL','RideSharing',12.0,0.9,0.5,0.2,18.0,15.0,0.0,10.0,5.0,'[]','[]','[]',4000,true,true,3,true,r.id);

    -- توصيل الأمانات + سائق بالساعة
    INSERT INTO hancr_service (name,name_en,service_type,base_fare,per_hundred_meters,per_minute_drive,per_minute_wait,minimum_fee,hourly_rate,provider_share_percent,prepay_percent,cancellation_total_fee,cancellation_driver_share,time_multipliers,weekday_multipliers,date_range_multipliers,search_radius,bid_mode_enabled,enabled,display_order,is_vip,region_id)
    VALUES
    ('توصيل طرد','Parcel','PackageDelivery',7.0,0.6,0.3,0.1,10.0,NULL,15.0,0.0,5.0,3.0,'[]','[]','[]',4000,false,true,4,false,r.id),
    ('سائق بالساعة','Hourly','HourlyChauffeur',0.0,0.0,0.0,0.0,40.0,40.0,15.0,0.0,5.0,3.0,'[]','[]','[]',5000,false,true,5,false,r.id);
  END LOOP;
END $$;

SELECT region_id, id, name_en, service_type, base_fare, hourly_rate FROM hancr_service ORDER BY region_id, display_order;
