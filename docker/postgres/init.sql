-- =============================================
-- HANCR — إعداد قاعدة البيانات الأولي
-- يُنفَّذ تلقائياً عند أول تشغيل للـ container
-- =============================================

-- تفعيل PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- إنشاء قاعدة بيانات الاختبار
CREATE DATABASE hancr_test;
GRANT ALL PRIVILEGES ON DATABASE hancr_test TO hancr;

-- الاتصال بقاعدة الاختبار وتفعيل extensions فيها
\c hancr_test;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- العودة للقاعدة الرئيسية
\c hancr;

-- تسجيل نجاح الإعداد
DO $$
BEGIN
  RAISE NOTICE 'HANCR PostgreSQL initialized successfully';
  RAISE NOTICE 'PostGIS version: %', PostGIS_Version();
END $$;
