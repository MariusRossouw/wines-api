drop table if exists tb_api_log;
CREATE TABLE IF NOT EXISTS tb_api_log (
  log_id SERIAL PRIMARY KEY,

  orig_id int,
  error varchar(100),
  type varchar(100),
  action_type varchar(50),
  action_name varchar(100),
  response jsonb,
  request jsonb,
  data jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);

DROP TABLE IF EXISTS tb_province;
CREATE TABLE IF NOT EXISTS tb_province(
  province_id SERIAL PRIMARY KEY,

  abrv VARCHAR(5),
  province_name VARCHAR(20),
  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);

DROP TABLE IF EXISTS tb_region;
CREATE TABLE IF NOT EXISTS tb_region(
  region_id SERIAL PRIMARY KEY,
  province_id INTEGER references tb_province(province_id),

  abrv VARCHAR(5),
  name VARCHAR(20),
  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);

DROP TABLE IF EXISTS tb_division;
CREATE TABLE IF NOT EXISTS tb_division(
  division_id SERIAL PRIMARY KEY,

  abrv VARCHAR(5),
  name VARCHAR(20),
  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);

DROP TABLE IF EXISTS tb_profile_type;
CREATE TABLE IF NOT EXISTS tb_profile_type(
  profile_type_id serial primary key,
  profile_type varchar(50),

  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);

drop table IF EXISTS tb_profile;
CREATE TABLE IF NOT EXISTS tb_profile(
  profile_id SERIAL PRIMARY KEY,
  profile_type_id int references tb_profile_type(profile_type_id),
  province_id INTEGER references tb_province(province_id),

  gender varchar(200),
  race varchar(200),
  dob varchar(10),
  first_name varchar(200),
  last_name varchar(200),
  title varchar(20),
  business_name varchar(200),
  name varchar(200),
  password varchar(200),
  password_unhashed varchar(200), -- drop column on production
  email varchar(200),
  mobile_no_exl varchar(20),
  mobile_country_code varchar(5),
  id_number varchar(20),
  address_line_1 varchar(200),
  address_line_2 varchar(200),
  address_line_3 varchar(200),
  address_line_4 varchar(200),
  jdata jsonb,
  status varchar(200),
  rep_id int,
  rep_name varchar(50),
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc'),
  verified BOOLEAN DEFAULT FALSE,
  verified_time timestamp without time zone
);

DROP TABLE IF EXISTS tb_document;
CREATE TABLE IF NOT EXISTS tb_document(
  document_id serial primary key,
  server_path text,
  url text,
  document_type varchar(50),
  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc'),
  is_deleted boolean default false,
  delete_time timestamp without time zone default (now() at time zone 'utc')
);

DROP TABLE IF EXISTS tb_entity_type;
CREATE TABLE IF NOT EXISTS tb_entity_type(
  entity_type_id serial primary key,
  entity_type varchar(20),
  create_time timestamp without time zone default (now() at time zone 'utc')
);

-- link a document to an entity(profile, merchant, product)
DROP TABLE IF EXISTS tb_entity_document_map;
CREATE TABLE IF NOT EXISTS tb_entity_document_map(
  entity_document_id serial primary key,
  document_id int references tb_document(document_id),
  entity_id int,
  entity_type_id int references tb_entity_type(entity_type_id),

  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);

DROP TABLE IF EXISTS tb_merchant;
CREATE TABLE IF NOT EXISTS tb_merchant(
  merchant_id SERIAL PRIMARY KEY,
  region_id int references tb_region(region_id),
  devision_id int references tb_division(division_id),
  province_id INTEGER references tb_province(province_id),

  abrv VARCHAR(50),
  merchant_name VARCHAR(200),
  address_line_1 varchar(200),
  address_line_2 varchar(200),
  address_line_3 varchar(200),
  address_line_4 varchar(200),
  email varchar(200),
  mobile_number varchar(30),
  status varchar(200),
  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);

DROP TABLE IF EXISTS tb_distributor;
CREATE TABLE IF NOT EXISTS tb_distributor(
  distributor_id SERIAL PRIMARY KEY,
  province_id INTEGER references tb_province(province_id),

  abrv VARCHAR(50),
  distributor_name VARCHAR(200),
  address_line_1 varchar(200),
  address_line_2 varchar(200),
  address_line_3 varchar(200),
  address_line_4 varchar(200),
  email varchar(200),
  mobile_number varchar(30),
  status varchar(200),
  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);

DROP TABLE IF EXISTS tb_product_type;
CREATE TABLE IF NOT EXISTS tb_product_type(
  product_type_id SERIAL PRIMARY KEY,

  abrv VARCHAR(5),
  product_type VARCHAR(20),
  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);

DROP TABLE IF EXISTS tb_product;
CREATE TABLE IF NOT EXISTS tb_product(
  product_id SERIAL PRIMARY KEY,
  product_type_id int references tb_product_type(product_type_id),

  abrv VARCHAR(50),
  product_name VARCHAR(200),
  description TEXT,
  vintage VARCHAR(50),
  blend boolean DEFAULT FALSE,
  color VARCHAR(50),
  item_code VARCHAR(50),
  size VARCHAR(50),
  status varchar(200),
  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);

DROP TABLE IF EXISTS tb_wine_farm;
CREATE TABLE IF NOT EXISTS tb_wine_farm(
  wine_farm_id serial primary key,

  farm_name varchar(200),
  address_line_1 varchar(200),
  address_line_2 varchar(200),
  address_line_3 varchar(200),
  address_line_4 varchar(200),
  email varchar(200),
  mobile_number varchar(30),
  status varchar(20),
  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);

DROP TABLE IF EXISTS tb_wine_farm_product_map;
CREATE TABLE IF NOT EXISTS tb_wine_farm_product_map(
  wine_farm_product_id serial primary key,
  wine_farm_id int references tb_wine_farm(wine_farm_id) not null,
  product_id int references tb_product(product_id) not null,

  create_time timestamp without time zone default (now() at time zone 'utc')
);

DROP TABLE IF EXISTS tb_wine_farm_profile_map;
CREATE TABLE IF NOT EXISTS tb_wine_farm_profile_map(
  wine_farm_profile_id serial primary key,
  wine_farm_id int references tb_wine_farm(wine_farm_id) not null,
  profile_id int references tb_profile(profile_id) not null,
  
  create_time timestamp without time zone default (now() at time zone 'utc')
);

DROP TABLE IF EXISTS tb_distributor_product_map;
CREATE TABLE IF NOT EXISTS tb_distributor_product_map(
  distributor_product_id serial primary key,
  distributor_id int references tb_distributor(distributor_id) not null,
  product_id int references tb_product(product_id) not null,
  
  create_time timestamp without time zone default (now() at time zone 'utc')
);

DROP TABLE IF EXISTS tb_profile_product_map;
CREATE TABLE IF NOT EXISTS tb_profile_product_map(
  profile_product_id serial primary key,
  profile_id int references tb_profile(profile_id) not null,
  product_id int references tb_product(product_id) not null,

  create_time timestamp without time zone default (now() at time zone 'utc')
);

DROP TABLE IF EXISTS tb_merchant_profile_map;
CREATE TABLE IF NOT EXISTS tb_merchant_profile_map(
  merchant_profile_id serial primary key,
  profile_id int references tb_profile(profile_id) not null,
  merchant_id int references tb_merchant(merchant_id) not null,

  create_time timestamp without time zone default (now() at time zone 'utc')
);

DROP TABLE IF EXISTS tb_transactions;
CREATE TABLE IF NOT EXISTS tb_transactions(
  transaction_id SERIAL PRIMARY KEY,
  product_id int references tb_product(product_id) not null,
  merchant_id int references tb_merchant(merchant_id) not null,
  profile_id int references tb_profile(profile_id) not null,

  quantity int,
  sale decimal,
  cases int,
  bottles int,
  litres numeric(12,2),
  transaction_year varchar(4),
  transaction_month varchar(2),
  transaction_date varchar(2),
  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);
