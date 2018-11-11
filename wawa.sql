CREATE TABLE wawa.tb_entity(
	entity_id SERIAL NOT NULL PRIMARY KEY,
	entity_type varchar(50),
	create_date timestamp NULL DEFAULT 'now'::text::timestamp(0) without time zone
);

CREATE TABLE wawa.tb_entity_map(
	entity_map_id SERIAL PRIMARY KEY,
	entity_id integer NULL,
	profile_id integer NULL,
	brand_id integer NULL,
	app_id integer NULL,
  repo_id integer NULL,
	path_id integer NULL,
	component_id integer NULL,
	task_id integer NULL,
	is_active boolean DEFAULT true,
	create_date timestamp NULL DEFAULT 'now'::text::timestamp(0) without time zone
);

CREATE TABLE wawa.tb_profile(
	profile_id SERIAL PRIMARY KEY,
  entity_id integer NULL,
	profile_name varchar NULL,
	email varchar NULL,
	contact_no varchar(200) NULL,
	password varchar(200) NOT NULL,
	img_path varchar(200),
	create_date timestamp NULL DEFAULT 'now'::text::timestamp(0) without time zone,
	update_date timestamp NULL DEFAULT 'now'::text::timestamp(0) without time zone
);

CREATE TABLE wawa.tb_brand(
	brand_id SERIAL PRIMARY KEY,
  entity_id integer NULL,
	brand_name varchar NULL,
	trading_as varchar NULL,
	registration_number varchar(200) NULL,
	vat_number varchar(200) NOT NULL,
	img_path varchar(200),
	create_date timestamp NULL DEFAULT 'now'::text::timestamp(0) without time zone,
	update_date timestamp NULL DEFAULT 'now'::text::timestamp(0) without time zone
);

CREATE TABLE wawa.tb_app(
	app_id SERIAL PRIMARY KEY,
  entity_id integer NULL,
	app_name varchar NULL,
	repo_id varchar(200) NULL,
	path_staging varchar(200) NOT NULL,
	path_production varchar(200),
	config_staging jsonb NULL DEFAULT '{}',,
	config_production jsonb NULL DEFAULT '{}',,
  create_date timestamp NULL DEFAULT 'now'::text::timestamp(0) without time zone,
	update_date timestamp NULL DEFAULT 'now'::text::timestamp(0) without time zone
);

CREATE TABLE wawa.tb_repo (
	repo_id SERIAL PRIMARY KEY,
	entity_id integer NOT NULL,
  repo_name varchar NULL,
	create_date timestamp NULL DEFAULT 'now'::text::timestamp(0) without time zone
);

CREATE TABLE wawa.tb_path (
	path_id SERIAL PRIMARY KEY,
	entity_id integer NOT NULL,
  path_name varchar NULL,
	create_date timestamp NULL DEFAULT 'now'::text::timestamp(0) without time zone
);

CREATE TABLE wawa.tb_component (
	component_id SERIAL PRIMARY KEY,
	entity_id integer NOT NULL,
  component_name varchar NULL,
	create_date timestamp NULL DEFAULT 'now'::text::timestamp(0) without time zone
);

CREATE TABLE wawa.tb_task(
  task_id SERIAL PRIMARY KEY,
  entity_id integer NULL,
  assigned_to integer NULL,
  created_by integer NULL,
  brand_id integer NULL,
  app_id integer NULL,
  path_id varchar NULL,
  component_id integer NULL,
  task_name varchar NULL,
  priority varchar NULL,
  description text,
  notes text,
  type varchar NULL,
  status varchar NULL,
  kind varchar NULL,
  size integer NULL,
  percentage_complete varchar NULL,
  create_date timestamp NULL DEFAULT 'now'::text::timestamp(0) without time zone,
  update_date timestamp NULL DEFAULT 'now'::text::timestamp(0) without time zone
);

CREATE TABLE wawa.tb_comment(
	comment_id SERIAL PRIMARY KEY,
  entity_id integer NULL,
	comment jsonb NULL DEFAULT '{}',,
	create_date timestamp NULL DEFAULT 'now'::text::timestamp(0) without time zone
);

CREATE TABLE wawa.tb_upload (
	upload_id SERIAL PRIMARY KEY,
  entity_id integer NULL,
	"type" varchar(255) NOT NULL,
	linked_path varchar(255) NOT NULL,
	name varchar(50),
	create_date timestamp NULL DEFAULT 'now'::text::timestamp(0) without time zone
);

CREATE TABLE wawa.tb_audit_trail (
	audit_trail_id SERIAL PRIMARY KEY,
	entity_id integer NOT NULL,
	audit jsonb NULL DEFAULT '{}',
	create_date timestamp NULL DEFAULT 'now'::text::timestamp(0) without time zone
);