create or replace function store_wine_list_xlsx(input json) returns JSON as
$$
	if(!plv8.ufn){
	  var sup = plv8.find_function("plv8_startup");
	  sup();
	}

	var result = {http_code: 200, message: 'Wine list data stored', data: {}}

	// var d_sql = `delete from tb`;

	var worksheet = input;
	var row = 2;
	var insert_count = 0;

	for (var key in worksheet) {
    if (worksheet.hasOwnProperty(key)) {
    	if(worksheet['C'+row]){

    		var jdata = {};

    		// insert farm
    		var farm_name = worksheet['C'+row].v;

    		var wf_sql = "insert into tb_wine_farm (farm_name, jdata) values ($1,$2) \
    			ON CONFLICT (farm_name) DO UPDATE SET farm_name=EXCLUDED.farm_name RETURNING wine_farm_id;";
    		var wf_sqlres = plv8.execute(wf_sql, farm_name, jdata);

    		var wine_farm_id = wf_sqlres[0].wine_farm_id;

    		var product_type = worksheet['D'+row].v;
    		var pt_sql = "insert into tb_product_type (product_type,jdata) values ($1,$2) \
    			ON CONFLICT (product_type) DO UPDATE SET product_type=EXCLUDED.product_type RETURNING product_type_id";
    		var pt_sqlres = plv8.execute(pt_sql, product_type, jdata);

    		var product_type_id = pt_sqlres[0].product_type_id;

    		var item_code = worksheet['A'+row] ? worksheet['A'+row].v : null;
    		var description = worksheet['B'+row] ? worksheet['B'+row].v : null;
    		var size = worksheet['I'+row] ? worksheet['I'+row].v : null;
    		var product_name = worksheet['E'+row] ? worksheet['E'+row].v : null;
    		var vintage = worksheet['H'+row] ? worksheet['H'+row].v : null;

    		var p_sql = "insert into tb_product (product_type_id,item_code,description,size,product_name,vintage,jdata) \
    			values ($1,$2,$3,$4,$5,$6,$7) \
    			ON CONFLICT (item_code) DO UPDATE SET item_code=EXCLUDED.item_code RETURNING product_id";
    		var p_sqlres = plv8.execute(p_sql,product_type_id,item_code,description,size,product_name,vintage,jdata);

    		var product_id = p_sqlres[0].product_id;

    		var pt_sql = "insert into tb_wine_farm_product_map (wine_farm_id,product_id) values ($1,$2) \
    			ON CONFLICT (wine_farm_id,product_id) DO UPDATE SET wine_farm_id=EXCLUDED.wine_farm_id RETURNING wine_farm_product_id";
    		var pt_sqlres = plv8.execute(pt_sql, wine_farm_id, product_id);
    	}

    	row++;
    }
	}

	return result;

$$ LANGUAGE plv8;