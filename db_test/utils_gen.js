
do language plv8 $$
	var rows = plv8.execute("SELECT code from plv8_modules where filename in ('utils_gen1.js','utils_gen2.js');");
	for (var r = 0; r < rows.length; r++)
	{
		var code = rows[r].code;
		eval("(function() { " + code + "})")();
	}
$$;

do language plv8 $$
  plv8.elog(INFO, utils_gen.testme4());
  plv8.elog(INFO, utils_gen.testme6());
  plv8.elog(INFO, utils_gen.testme7());
$$;
