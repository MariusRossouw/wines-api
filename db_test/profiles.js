
do language plv8 $$
  var myFunction = plv8.find_function("fn_register");
  var o = {
    email : 'test@test.com',
    name : 'Jan Tester',
    password : 'password1234'
  };
  var result = myFunction('{}','{}',JSON.stringify(o));
  plv8.elog(INFO, JSON.stringify(result));
$$;

do language plv8 $$
  var myFunction = plv8.find_function("fn_login");
  var o = {
    email : 'test@test.com',
    password : 'password1234'
  };
  var result = myFunction('{}',JSON.stringify(o),'{}');
  plv8.elog(INFO, JSON.stringify(result));
$$;

do language plv8 $$
  var myFunction = plv8.find_function("fn_profiles_get_one");
  var o = {
    id : '1'
  };
  var result = myFunction(JSON.stringify(o),'{}','{}');
  plv8.elog(INFO, JSON.stringify(result));
$$;

do language plv8 $$
  var myFunction = plv8.find_function("fn_profiles_list");
  var result = myFunction('{}','{}','{}');
  plv8.elog(INFO, JSON.stringify(result));
$$;