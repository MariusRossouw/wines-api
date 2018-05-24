do language plv8 
$$

if(!plv8.ufn){
  var sup = plv8.find_function("plv8_startup");
  sup();
}


var test_province = [
    {"abrv":"EC", "name":"Eastern Cape"},
    {"abrv":"FS", "name":"Free State"},
    {"abrv":"GT", "name":"Gauteng"},
    {"abrv":"NL", "name":"KwaZulu-Natal"},
    {"abrv":"LP", "name":"Limpopo"},
    {"abrv":"MP", "name":"Mpumalanga"},
    {"abrv":"NW", "name":"North West"},
    {"abrv":"NC", "name":"Northern Cape"},
    {"abrv":"WC", "name":"Western Cape"}
  ];

  for(var i = 0; i < test_province.length; i++){
    var p = test_province[i];
    plv8.ufn.new_province(p.abrv, p.name);
  };
  
$$;