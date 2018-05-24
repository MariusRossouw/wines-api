#!/bin/bash

#clear everthing

# use queries below instead of clear_db.js which caused this error:
# { error: Error: cannot drop function uuid_nil() because extension uuid-ossp requires it

# DROP DATABASE wines;

# CREATE DATABASE wines
#   WITH OWNER = nodejs
#        ENCODING = 'UTF8'
#        TABLESPACE = pg_default
#        LC_COLLATE = 'en_US.UTF-8'
#        LC_CTYPE = 'en_US.UTF-8'
#        CONNECTION LIMIT = -1;

# CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
# CREATE EXTENSION IF NOT EXISTS "plv8";

# node db_init_util/run_sql_script.js --file db_init_util/clear_db.js

node db_init_util/run_sql_script.js --file db_init_util/setup_plv8_startup.sql

node db_init_util/util_module_save_3rdparty.js --folder db_3rdparty_modules
node db_init_util/call_stored_function --name plv8_util_module_load_all_3rdparty

node db_init_util/util_module_save.js --folder db_utils
node db_init_util/call_stored_function --name plv8_util_module_load_all

#setup tables and stored functions
node db_init_util/run_sql_script.js --file db_init_a/setup_tables.sql
node db_init_util/run_sql_script.js --folder db_functions

#seed data
node db_init_util/run_sql_script.js --file seeds/seed_profile.js
node db_init_util/run_sql_script.js --file seeds/seed_province.js


#run the server
export NODE_SERVER_PORT=31001
node server.js

