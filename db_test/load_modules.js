do language plv8 $$
	var rows = plv8.execute("SELECT code from plv8_modules;");
	for (var r = 0; r < rows.length; r++)
	{
		var code = rows[r].code;
		eval("(function() { " + code + "})")();
	}
$$;
