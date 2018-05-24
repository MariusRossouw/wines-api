do language plv8 $$ 
  var m = moment();
  plv8.elog(NOTICE,m.format('YYYY-MM-DDTHH:mm:ss')); 
$$;


do language plv8 $$ 
  x = { 'a':1 }; 
  y=_.extend(x, { 'a':2,'b':3 }, { 'b':4, 'c':5 }); 
  plv8.elog(NOTICE,JSON.stringify(y)); 
$$;


do language plv8 $$ 
	var rows = plv8.execute("SELECT code from plv8_modules;");
	for (var r = 0; r < rows.length; r++)
	{
		var code = rows[r].code;
		eval("(function() { " + code + "})")();
	}
$$;
do language plv8 $$ 
  plv8.elog(NOTICE,utils.testme()); 
$$;

do language plv8 $$ 
  var v = '2013';
  plv8.elog(NOTICE,validator.isInt(v));
$$;