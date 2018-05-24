drop table IF EXISTS tb_profile;
CREATE TABLE IF NOT EXISTS tb_profile(
  id SERIAL PRIMARY KEY,
  profile_type varchar(200),
  gender varchar(200),
  race varchar(200),
  dob varchar(40),
  first_name varchar(200),
  last_name varchar(200),
  title varchar(20),
  business_name varchar(200),
  name varchar(200),
  password varchar(200),
  email varchar(200),
  mobile_number varchar(30),
  id_number varchar(20),
  physical_address varchar(200),
  physical_suburb varchar(200),
  physical_city_town varchar(200),
  physical_postal_code varchar(20),
  physical_province_id INTEGER,
  jdata jsonb,
  verified BOOLEAN DEFAULT FALSE,
  status varchar(200),
  img varchar(200),
  create_date varchar(24),
  create_time varchar(24),
  create_display_time varchar(24),
  update_date varchar(24),
  update_time varchar(24),
  update_display_time varchar(24),
  verified_date varchar(24),
  verified_time varchar(24),
  verified_display_time varchar(24)
);

DROP TABLE IF EXISTS tb_province;
CREATE TABLE IF NOT EXISTS tb_province(
  id SERIAL PRIMARY KEY,
  abrv VARCHAR(5),
  name VARCHAR(20),
  jdata jsonb,
  create_date varchar(24),
  create_time varchar(24),
  create_display_time varchar(24),
  update_date varchar(24),
  update_time varchar(24),
  update_display_time varchar(24)
);

drop table if exists tb_api_log;
CREATE TABLE IF NOT EXISTS tb_api_log (
  id SERIAL PRIMARY KEY,
  orig_id int,
  error varchar(100),
  type varchar(100),
  action_type varchar(50),
  action_name varchar(100),
  data jsonb,
  create_time varchar(24)
);

DROP TABLE IF EXISTS tb_merchants;
CREATE TABLE IF NOT EXISTS tb_merchants(
  id SERIAL PRIMARY KEY,
  abrv VARCHAR(50),
  name VARCHAR(200),
  region_id int,
  devision_id int,
  physical_address varchar(200),
  physical_suburb varchar(200),
  physical_city_town varchar(200),
  physical_postal_code varchar(20),
  physical_province_id INTEGER,
  email varchar(200),
  mobile_number varchar(30),
  status varchar(200),
  img varchar(200),
  jdata jsonb,
  create_date varchar(24),
  create_time varchar(24),
  create_display_time varchar(24),
  update_date varchar(24),
  update_time varchar(24),
  update_display_time varchar(24)
);

DROP TABLE IF EXISTS tb_distributors;
CREATE TABLE IF NOT EXISTS tb_distributors(
  id SERIAL PRIMARY KEY,
  abrv VARCHAR(50),
  name VARCHAR(200),
  physical_address varchar(200),
  physical_suburb varchar(200),
  physical_city_town varchar(200),
  physical_postal_code varchar(20),
  physical_province_id INTEGER,
  email varchar(200),
  mobile_number varchar(30),
  status varchar(200),
  img varchar(200),
  jdata jsonb,
  create_date varchar(24),
  create_time varchar(24),
  create_display_time varchar(24),
  update_date varchar(24),
  update_time varchar(24),
  update_display_time varchar(24)
);


DROP TABLE IF EXISTS tb_transactions;
CREATE TABLE IF NOT EXISTS tb_transactions(
  id SERIAL PRIMARY KEY,
  product_id int,
  quantity varchar(24),
  sale varchar(24),
  cases varchar(24),
  bottles varchar(24),
  liters varchar(24),
  transaction_year varchar(24),
  transaction_month varchar(24),
  transaction_date varchar(24),
  merchant_id int,
  rep_id int,
  jdata jsonb,
  create_date varchar(24),
  create_time varchar(24),
  create_display_time varchar(24),
  update_date varchar(24),
  update_time varchar(24),
  update_display_time varchar(24)
);


DROP TABLE IF EXISTS tb_products;
CREATE TABLE IF NOT EXISTS tb_products(
  id SERIAL PRIMARY KEY,
  abrv VARCHAR(50),
  name VARCHAR(200),
  description TEXT,
  vintage VARCHAR(50),
  product_type_id int,
  blend boolean DEFAULT FALSE,
  color VARCHAR(50),
  item_code VARCHAR(50),
  size VARCHAR(50),
  status varchar(200),
  img varchar(200),
  jdata jsonb,
  create_date varchar(24),
  create_time varchar(24),
  create_display_time varchar(24),
  update_date varchar(24),
  update_time varchar(24),
  update_display_time varchar(24)
);


DROP TABLE IF EXISTS tb_regions;
CREATE TABLE IF NOT EXISTS tb_regions(
  id SERIAL PRIMARY KEY,
  abrv VARCHAR(5),
  name VARCHAR(20),
  jdata jsonb,
  create_date varchar(24),
  create_time varchar(24),
  create_display_time varchar(24),
  update_date varchar(24),
  update_time varchar(24),
  update_display_time varchar(24)
);


DROP TABLE IF EXISTS tb_devisions;
CREATE TABLE IF NOT EXISTS tb_devisions(
  id SERIAL PRIMARY KEY,
  abrv VARCHAR(5),
  name VARCHAR(20),
  jdata jsonb,
  create_date varchar(24),
  create_time varchar(24),
  create_display_time varchar(24),
  update_date varchar(24),
  update_time varchar(24),
  update_display_time varchar(24)
);


DROP TABLE IF EXISTS tb_product_types;
CREATE TABLE IF NOT EXISTS tb_product_types(
  id SERIAL PRIMARY KEY,
  abrv VARCHAR(5),
  name VARCHAR(20),
  jdata jsonb,
  create_date varchar(24),
  create_time varchar(24),
  create_display_time varchar(24),
  update_date varchar(24),
  update_time varchar(24),
  update_display_time varchar(24)
);
