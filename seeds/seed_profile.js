do language plv8 
$$

  if(!plv8.ufn){
    var sup = plv8.find_function("plv8_startup");
    sup();
  }

  var test_profile = [
		{'profile_type': 1, 'email':'michiel@westerncapewines.co.za', 'first_name':'Michiel', 'last_name':'de Beer', 'name': 'Michiel de Beer', 'password':'admin1234', 'mobile_no_exl':'711231234', 'mobile_country_code': '27','verified': true},
    {'profile_type': 1, 'email':'marius@stratech.co.za', 'first_name':'Marius', 'last_name':'Rossouw', 'name': 'Marius Rossouw', 'password':'admin1234', 'mobile_no_exl':'793327238', 'mobile_country_code': '27','verified': true},
    {'profile_type': 1, 'email':'hymnect@gmail.com', 'first_name':'Hymne', 'last_name':'Rossouw', 'name': 'Hymne Rossouw', 'password':'admin1234', 'mobile_no_exl':'636601501', 'mobile_country_code': '27','verified': true}
  ];

  for(var i = 0; i < test_profile.length; i++){
    var p = test_profile[i];

    var new_profile_id = plv8.ufn.new_profile(p.profile_type, p.email, p.first_name, p.last_name, p.name, p.password, p.mobile_no_exl, p.mobile_country_code, p.verified);
  }4
  

$$;
