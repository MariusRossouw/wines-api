-- tables need to be dropped in a specific order due to dependencies

drop table if exists tb_api_log;
DROP TABLE IF EXISTS tb_transactions;
DROP TABLE IF EXISTS tb_budget;
DROP TABLE IF EXISTS tb_merchant_profile_map;
DROP TABLE IF EXISTS tb_profile_product_map;
DROP TABLE IF EXISTS tb_distributor_product_map;
DROP TABLE IF EXISTS tb_wine_farm_profile_map;
DROP TABLE IF EXISTS tb_wine_farm_product_map;
DROP TABLE IF EXISTS tb_profile_type_map;
DROP TABLE IF EXISTS tb_wine_farm;
DROP TABLE IF EXISTS tb_product;
DROP TABLE IF EXISTS tb_product_type;
DROP TABLE IF EXISTS tb_distributor;
DROP TABLE IF EXISTS tb_merchant;
DROP TABLE IF EXISTS tb_merchant_group;
DROP TABLE IF EXISTS tb_entity_document_map;
DROP TABLE IF EXISTS tb_entity_type;
DROP TABLE IF EXISTS tb_document;
DROP TABLE IF EXISTS tb_manager_rep_map;
DROP TABLE IF EXISTS tb_manager_farm_map;
drop table IF EXISTS tb_profile;
DROP TABLE IF EXISTS tb_type;
DROP TABLE IF EXISTS tb_division;
DROP TABLE IF EXISTS tb_region;
DROP TABLE IF EXISTS tb_province;
DROP TABLE IF EXISTS tb_api_docs_req_res;
DROP TABLE IF EXISTS tb_api_docs_endpoint;
DROP TABLE IF EXISTS tb_api_doc_sections;

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

CREATE TABLE IF NOT EXISTS tb_api_doc_sections (
  api_doc_section_id SERIAL PRIMARY KEY,

  sectionName varchar(100),
  projectName varchar(100),
  data jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);

CREATE TABLE IF NOT EXISTS tb_api_docs_endpoint (
  api_doc_endpoint_id SERIAL PRIMARY KEY,
  api_doc_section_id INTEGER references tb_api_doc_sections(api_doc_section_id),

  subSectionName varchar(100),
  method varchar(100),
  endpoint varchar(100),
  description varchar(100),
  requirements varchar(100),
  requiredFields jsonb,
  reqRes jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);

CREATE TABLE IF NOT EXISTS tb_api_docs_req_res (
  api_doc_req_res_id SERIAL PRIMARY KEY,
  api_doc_endpoint_id INTEGER references tb_api_docs_endpoint(api_doc_endpoint_id),

  headers text,
  resCode int,
  requestBody jsonb,
  responseBody jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);

CREATE TABLE IF NOT EXISTS tb_province(
  province_id SERIAL PRIMARY KEY,

  abrv VARCHAR(5),
  province_name VARCHAR(20) unique default 'Other',
  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);

CREATE TABLE IF NOT EXISTS tb_region(
  region_id SERIAL PRIMARY KEY,
  province_id INTEGER references tb_province(province_id),

  abrv VARCHAR(5),
  region_name VARCHAR(20) unique default 'Other',
  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);


CREATE TABLE IF NOT EXISTS tb_division(
  division_id SERIAL PRIMARY KEY,

  abrv VARCHAR(5),
  division_name VARCHAR(20) unique default 'Other',
  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);


CREATE TABLE IF NOT EXISTS tb_type(
  type_id serial primary key,
  type varchar(50) unique,

  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);


CREATE TABLE IF NOT EXISTS tb_profile(
  profile_id SERIAL PRIMARY KEY,
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
  rep_code varchar(200) unique,
  rep_name varchar(50),
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc'),
  verified BOOLEAN DEFAULT true,
  verified_time timestamp without time zone
);

ALTER TABLE tb_profile ADD COLUMN type character varying(10) DEFAULT 'Rep';

CREATE TABLE IF NOT EXISTS tb_profile_type_map(
  profile_type_id serial primary key,
  type_id int references tb_type(type_id),
  profile_id int references tb_profile(profile_id),

  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc'),
  CONSTRAINT u_profile_type UNIQUE (profile_id,type_id)
);

CREATE TABLE IF NOT EXISTS tb_manager_rep_map(
  manager_rep_id serial primary key,
  manager_id int references tb_profile(profile_id),
  rep_id int references tb_profile(profile_id),

  is_active boolean default true,
  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc'),
  CONSTRAINT u_manager_rep UNIQUE (manager_id,rep_id)
);

CREATE TABLE IF NOT EXISTS tb_manager_farm_map(
  manager_farm_id serial primary key,
  manager_id int references tb_profile(profile_id),
  farm_id int references tb_wine_farm(wine_farm_id),

  is_active boolean default true,
  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc'),
  CONSTRAINT u_manager_farm UNIQUE (manager_id,farm_id)
);

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


CREATE TABLE IF NOT EXISTS tb_entity_type(
  entity_type_id serial primary key,
  entity_type varchar(20),
  create_time timestamp without time zone default (now() at time zone 'utc')
);

-- link a document to an entity(profile, merchant, product)

CREATE TABLE IF NOT EXISTS tb_entity_document_map(
  entity_document_id serial primary key,
  document_id int references tb_document(document_id),
  entity_id int,
  entity_type_id int references tb_entity_type(entity_type_id),

  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);

CREATE TABLE IF NOT EXISTS tb_merchant_group(
  merchant_group_id serial primary key,
  group_name varchar(200) unique default 'Other',

  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);


CREATE TABLE IF NOT EXISTS tb_merchant(
  merchant_id SERIAL PRIMARY KEY,
  region_id int references tb_region(region_id),
  division_id int references tb_division(division_id),
  province_id INTEGER references tb_province(province_id),
  merchant_group_id INTEGER references tb_merchant_group(merchant_group_id),

  code varchar(50),
  account varchar(50),

  abrv VARCHAR(50),
  merchant_name VARCHAR(200) unique,
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


CREATE TABLE IF NOT EXISTS tb_distributor(
  distributor_id SERIAL PRIMARY KEY,
  province_id INTEGER references tb_province(province_id),

  abrv VARCHAR(50),
  distributor_name VARCHAR(200) unique,
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


CREATE TABLE IF NOT EXISTS tb_product_type(
  product_type_id SERIAL PRIMARY KEY,

  abrv VARCHAR(5),
  product_type VARCHAR(20) UNIQUE default 'Other',
  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);


CREATE TABLE IF NOT EXISTS tb_product(
  product_id SERIAL PRIMARY KEY,
  product_type_id int references tb_product_type(product_type_id),

  abrv VARCHAR(50),
  product_name VARCHAR(200),
  cultivar VARCHAR(200),
  special VARCHAR(200),
  description TEXT,
  product_classification varchar(200),
  vintage VARCHAR(50),
  blend boolean DEFAULT FALSE,
  color VARCHAR(50),
  item_code VARCHAR(50) UNIQUE,
  size VARCHAR(50),
  volume varchar(10),
  measurement varchar(20),
  case_size varchar(10),
  status varchar(200),
  jdata jsonb,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc')
);


CREATE TABLE IF NOT EXISTS tb_wine_farm(
  wine_farm_id serial primary key,

  farm_name varchar(200) UNIQUE,
  farm_name_alias varchar(200) UNIQUE,
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


CREATE TABLE IF NOT EXISTS tb_wine_farm_product_map(
  wine_farm_product_id serial primary key,
  wine_farm_id int references tb_wine_farm(wine_farm_id) not null,
  product_id int references tb_product(product_id) not null,

  create_time timestamp without time zone default (now() at time zone 'utc'),

  CONSTRAINT u_wine_farm_product UNIQUE (wine_farm_id,product_id)
);


CREATE TABLE IF NOT EXISTS tb_wine_farm_profile_map(
  wine_farm_profile_id serial primary key,
  wine_farm_id int references tb_wine_farm(wine_farm_id) not null,
  profile_id int references tb_profile(profile_id) not null,

  create_time timestamp without time zone default (now() at time zone 'utc'),

  CONSTRAINT u_wine_farm_profile UNIQUE (wine_farm_id,profile_id)
);

CREATE TABLE IF NOT EXISTS tb_distributor_product_map(
  distributor_product_id serial primary key,
  distributor_id int references tb_distributor(distributor_id) not null,
  product_id int references tb_product(product_id) not null,

  create_time timestamp without time zone default (now() at time zone 'utc'),

  CONSTRAINT u_distributor_product UNIQUE (distributor_id,product_id)
);

CREATE TABLE IF NOT EXISTS tb_profile_product_map(
  profile_product_id serial primary key,
  profile_id int references tb_profile(profile_id) not null,
  product_id int references tb_product(product_id) not null,

  create_time timestamp without time zone default (now() at time zone 'utc'),

  CONSTRAINT u_profile_product UNIQUE (profile_id,product_id)
);

CREATE TABLE IF NOT EXISTS tb_merchant_profile_map(
  merchant_profile_id serial primary key,
  profile_id int references tb_profile(profile_id) not null,
  merchant_id int references tb_merchant(merchant_id) not null,

  create_time timestamp without time zone default (now() at time zone 'utc'),

  CONSTRAINT u_merchant_profile UNIQUE (merchant_id,profile_id)
);

CREATE TABLE IF NOT EXISTS tb_transactions(
  transaction_id SERIAL PRIMARY KEY,
  product_id int references tb_product(product_id) not null,
  merchant_id int references tb_merchant(merchant_id) not null,
  profile_id int references tb_profile(profile_id) not null,

  quantity int,
  sale decimal,
  cases int,
  transaction_type varchar(200),
  bottles int,
  period varchar(200),
  litres numeric(12,2),
  transaction_year varchar(12),
  transaction_month varchar(15),
  transaction_day varchar(2),
  transaction_code varchar(200) unique,
  jdata jsonb,
  upload_row_number int,
  create_time timestamp without time zone default (now() at time zone 'utc'),
  update_time timestamp without time zone default (now() at time zone 'utc'),
  CONSTRAINT u_transaction_row UNIQUE (merchant_id,profile_id,transaction_year,transaction_month,transaction_day,sale,upload_row_number)
);

CREATE TABLE IF NOT EXISTS tb_budget(
  budget_id serial primary key,
  merchant_id int references tb_merchant(merchant_id) not null,

  budget_month varchar(20),
  budget_amount numeric(12,2),
  budget_period varchar(20),

  create_time timestamp without time zone default (now() at time zone 'utc'),

  CONSTRAINT u_merchant_budget UNIQUE (merchant_id,budget_month)
);