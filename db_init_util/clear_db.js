do language plv8 $$

  var function_select = "SELECT  'drop function ' || p.proname || '(' || oidvectortypes(p.proargtypes) || ');' instruction \
		FROM    pg_catalog.pg_namespace n \
		JOIN    pg_catalog.pg_proc p \
		ON      p.pronamespace = n.oid \
		WHERE   n.nspname = 'public'; \
	";

  var table_select = "SELECT 'drop table ' || table_name || ';' instruction \
		FROM information_schema.tables \
		WHERE  table_type = 'BASE TABLE' \
		and table_schema = 'public' \
		and table_name not in ('tb_contact_us') \
		ORDER BY table_name; \
	";
  //		and table_name != 'plv8_modules' \

  var functions = plv8.execute(function_select,[]);
  var tables = plv8.execute(table_select,[]);

  for (var i = 0; i < functions.length; i++){
		var f = functions[i];
		var res = plv8.execute(f.instruction,[]);
  }

  for (var i = 0; i < tables.length; i++){
		var t = tables[i];
		var res = plv8.execute(t.instruction,[]);
  }

  //plv8.elog(INFO, JSON.stringify(result));
$$;
