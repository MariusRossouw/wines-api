(function (root) {
  if(!plv8.ufn){
    return;
  }

  plv8.ufn.testme2020 = function(){
    return 'I am tested 2020xxx';
  };
  plv8.ufn.testme2020b = function(){
    return 'I am tested 2020xxx';
  };

// do language plv8 $$
//   plv8.elog(INFO, plv8.ufn.testme2020b());
// $$;

	plv8.ufn.testme4 = function(){
		return 'I am tested444';
	};

  plv8.ufn.isNumber = function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  };
  plv8.ufn.validateNumber = function(n){
    var r = {valid:false, value:0};
    if(!n){
      return r;
    }
    // if(_.isString(n)){
    //   var num = parseFloat(n);
    //   if(!isNaN(num) && isFinite(num)){
    //     r.valid = true;
    //     r.value = num;
    //     return r;
    //   }
    // };
    // if(_.isNumber(n)){
    //   if(!isNaN(n) && isFinite(n)){
    //     r.valid = true;
    //     r.value = n;
    //     return r;
    //   }
    // }
    try {
      r.value = parseFloat(n);
      r.valid = true;
      return r;
    } catch (err){
      r.valid = false;
      return r;
    }
    return r;
    //Math.round(parseFloat(yourString), 2)
  };

  plv8.ufn.concat_names = function(a) {
    var name = '';
    for (var i=0;i< a.length;i++){
      if (a[i] && a[i].length > 0){
        if (name.length > 0){
          name = name + ' ';
        }
        name = name + a[i];
      }
    }
    return name;
  }

  plv8.ufn.generateUUID = function() {
      var d = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = (d + Math.random()*16)%16 | 0;
          d = Math.floor(d/16);
          return (c=='x' ? r : (r&0x3|0x8)).toString(16);
      });
      return uuid;
  };

  plv8.ufn.defaultval = function(v, def) {
      var r = def;
      if(v){
        r = v;
      };
      return r;
  };




}(this));