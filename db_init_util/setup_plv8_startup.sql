/*
http://adpgtech.blogspot.co.za/2013/03/loading-useful-modules-in-plv8.html
https://www.bountysource.com/issues/10902524-exposing-plv8-to-each-other-automatically

http://stackoverflow.com/questions/21431887/postgres-plv8-custom-error-lose-custom-properties?rq=1
http://stackoverflow.com/questions/33339686/loading-node-modules-in-postgresql-plv8?rq=1
http://stackoverflow.com/questions/21073165/postgresql-plv8-start-proc
*/
drop table IF EXISTS tb_debug;
CREATE TABLE IF NOT EXISTS tb_debug (
  id SERIAL PRIMARY KEY,
  test_text text,
  jdata jsonb
);

drop table IF EXISTS plv8_modules;
create table plv8_3dparty_modules(filename varchar(200) primary key, code text);

drop table IF EXISTS plv8_modules;
create table plv8_util_modules(filename varchar(200) primary key, code text);

create or replace function plv8_startup()
returns void
language plv8
as
$$
	if(!plv8.ufn){
		plv8.ufn = {};
	}

	var rows = plv8.execute("SELECT code from plv8_3dparty_modules;");
	for (var r = 0; r < rows.length; r++)
	{
		var code = rows[r].code;
		eval("(function() { " + code + "})")();
	}

	var rows = plv8.execute("SELECT code from plv8_util_modules;");
	for (var r = 0; r < rows.length; r++)
	{
		var code = rows[r].code;
		eval("(function() { " + code + "})")();
	}
$$;

create or replace function plv8_util_module_load_one(filename text)
returns void
language plv8
as
$$
	var rows = plv8.execute("SELECT code from plv8_util_modules where filename = $1;", filename);
	for (var r = 0; r < rows.length; r++)
	{
		var code = rows[r].code;
		eval("(function() { " + code + "})")();
	}
$$;

create or replace function plv8_util_module_load_all()
returns void
language plv8
as
$$
	var rows = plv8.execute("SELECT filename, code from plv8_util_modules;");
	for (var r = 0; r < rows.length; r++)
	{
		var code = rows[r].code;
    plv8.elog(INFO, 'filename: ' + rows[r].filename);
		eval("(function() { " + code + "})")();
	}
$$;

create or replace function plv8_util_module_load_all_3rdparty()
returns void
language plv8
as
$$
	var rows = plv8.execute("SELECT code from plv8_3dparty_modules;");
	for (var r = 0; r < rows.length; r++)
	{
		var code = rows[r].code;
		eval("(function() { " + code + "})")();
	}
$$;