do language plv8 
$$

  if(!plv8.ufn){
    var sup = plv8.find_function("plv8_startup");
    sup();
  }

  var test_profile = [
		{'id': 1, 'profile_type': 'Individual', 'email':'michiel@stratech.co.za', 'first_name':'Michiel', 'last_name':'de Beer', 'name': 'Michiel de Beer', 'password':'admin1234', 'mobile_number':'0711231234','verified': true},
    {'id': 2, 'profile_type': 'Individual', 'email':'marius@stratech.co.za', 'first_name':'Marius', 'last_name':'Rossouw', 'name': 'Marius Rossouw', 'password':'admin1234', 'mobile_number':'0793327238','verified': true},
    {'id': 3, 'profile_type': 'Individual', 'email':'hymnect@gmail.com', 'first_name':'Hymne', 'last_name':'Rossouw', 'name': 'Hymne Rossouw', 'password':'admin1234', 'mobile_number':'0636601501','verified': true}
  ];

  for(var i = 0; i < test_profile.length; i++){
    var p = test_profile[i];

    var new_profile_id = plv8.ufn.new_profile(p.id, p.profile_type, p.email, p.first_name, p.last_name, p.name, p.password, p.mobile_number, p.verified);
  }4
  

$$;
