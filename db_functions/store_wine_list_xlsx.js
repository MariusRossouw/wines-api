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

            // Farm/category/type/name/cultivar/vintage/special/bottle size/volume/case packing
            var str = worksheet['H'+row] ? worksheet['H'+row].v : '';
            str = str.replace(/   +/g, ' - ');
            var str_arr = str.split(/[  ]+/);

    		// FARM
    		var farm_name = str_arr[0];

    		var wf_sql = "insert into tb_wine_farm (farm_name, jdata) values ($1,$2) \
    			ON CONFLICT (farm_name) DO UPDATE SET farm_name=EXCLUDED.farm_name RETURNING wine_farm_id;";
    		var wf_sqlres = plv8.execute(wf_sql, farm_name, jdata);

    		var wine_farm_id = wf_sqlres[0].wine_farm_id;

            // PRODUCT TYPE
    		var product_type = str_arr[1];
    		var pt_sql = "insert into tb_product_type (product_type,jdata) values ($1,$2) \
    			ON CONFLICT (product_type) DO UPDATE SET product_type=EXCLUDED.product_type RETURNING product_type_id";
    		var pt_sqlres = plv8.execute(pt_sql, product_type, jdata);

    		var product_type_id = pt_sqlres[0].product_type_id;

            // PRODUCT
    		var item_code = worksheet['G'+row] ? worksheet['G'+row].v : null;
    		var description = worksheet['H'+row] ? worksheet['H'+row].v : null;
            var product_classification = worksheet['X'+row] ? worksheet['X'+row].v : null;
            var color = str_arr[2];
            var product_name = str_arr[3];
            var cultivar = str_arr[4];
            var vintage = str_arr[5];
            var special = str_arr[6];
    		var size = str_arr[7];
            var measurement = str_arr[8];

            var size_numeric = size.replace(size, ',', '.');
            var volume = measurement == 'lt' ? (parseFloat(size_numeric)*1000) : size;

            var case_size = str_arr[9].replace('(','').replace(')','');

    		var p_sql = "insert into tb_product (product_type_id,item_code,description,size,product_name,vintage,jdata,color,cultivar,special,measurement,volume,case_size,product_classification) \
    			values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) \
    			ON CONFLICT (item_code) DO UPDATE SET item_code=EXCLUDED.item_code RETURNING product_id";
    		var p_sqlres = plv8.execute(p_sql,product_type_id,item_code,description,size,product_name,vintage,jdata,color,cultivar,special,measurement,volume,case_size,product_classification);

    		var product_id = p_sqlres[0].product_id;

            // PRODUCT/FARM MAP
    		var pt_sql = "insert into tb_wine_farm_product_map (wine_farm_id,product_id) values ($1,$2) \
    			ON CONFLICT (wine_farm_id,product_id) DO UPDATE SET wine_farm_id=EXCLUDED.wine_farm_id RETURNING wine_farm_product_id";
    		var pt_sqlres = plv8.execute(pt_sql, wine_farm_id, product_id);

            // PROVINCE
            var province_name = worksheet['R'+row] ? worksheet['R'+row].v : null;
            var pr_sql = "insert into tb_province (province_name) values ($1) \
                ON CONFLICT (province_name) DO UPDATE SET province_name=EXCLUDED.province_name RETURNING province_id";
            var pr_sqlres = plv8.execute(pr_sql, province_name);

            var province_id = pr_sqlres[0].province_id;

            // DIVISION
            // var division_name = worksheet['T'+row] ? worksheet['T'+row].v : null;
            // var d_sql = "insert into tb_division (division_name) values ($1) \
            //     ON CONFLICT (division_name) DO UPDATE SET division_name=EXCLUDED.division_name RETURNING division_id";
            // var d_sqlres = plv8.execute(d_sql, province_name);

            // var division_id = d_sqlres[0].division_id;
            
            // REGION
            var region_name = worksheet['S'+row] ? worksheet['S'+row].v : null;
            var r_sql = "insert into tb_region (region_name, province_id) values ($1,$2) \
                ON CONFLICT (region_name) DO UPDATE SET region_name=EXCLUDED.region_name RETURNING region_id";
            var r_sqlres = plv8.execute(r_sql, province_name, province_id);

            var region_id = r_sqlres[0].region_id;
            
            // MERCHANT GROUP
            var group_name = worksheet['T'+row] ? worksheet['T'+row].v : null;
            var g_sql = "insert into tb_merchant_group (group_name) values ($1) \
                ON CONFLICT (group_name) DO UPDATE SET group_name=EXCLUDED.group_name RETURNING merchant_group_id";
            var g_sqlres = plv8.execute(g_sql, group_name);

            var merchant_group_id = g_sqlres[0].merchant_group_id;
            
            // MERCHANT
            var merchant_name = worksheet['D'+row] ? worksheet['D'+row].v : null;
            var code = worksheet['A'+row] ? worksheet['A'+row].v : null;;
            var account = worksheet['C'+row] ? worksheet['C'+row].v : null;

            var m_sql = "insert into tb_merchant (merchant_name,province_id,region_id,merchant_group_id,code,account) \
                values ($1,$2,$3,$4,$5,$6) \
                ON CONFLICT (merchant_name) \
                DO UPDATE SET merchant_name=EXCLUDED.merchant_name RETURNING merchant_id";
            var m_sqlres = plv8.execute(m_sql, merchant_name, province_id, region_id, merchant_group_id,code,account);

            var merchant_id = m_sqlres[0].merchant_id;
            
            // REP PROFILE
            var profile_jdata = jdata;
            // profile_jdata.email_token = plv8.ufn.generateUUID();
            profile_jdata.email_token = '1234';

            var rep_name = worksheet['F'+row] ? worksheet['F'+row].v : null;

            var names = rep_name.split(' ');
            var first_name = names[0];
            var last_names = names.splice(0,1);
            var last_name = last_names.join(' ');

            // var email = worksheet['O'+row] ? worksheet['O'+row].v : null;
            var rep_code = worksheet['E'+row] ? worksheet['E'+row].v : null;
            var p_sql = "insert into tb_profile (rep_code,rep_name, first_name, last_name) values ($1,$2,$3,$4) \
                ON CONFLICT (rep_code) DO UPDATE SET rep_code=EXCLUDED.rep_code RETURNING profile_id";
            var p_sqlres = plv8.execute(p_sql, rep_code, rep_name, first_name, last_name);

            var profile_id = p_sqlres[0].profile_id;
            
            // TRANSACTION
            var t_quantity = worksheet['I'+row] ? worksheet['I'+row].v: null;
            var t_sale = worksheet['K'+row] ? worksheet['K'+row].v: null;
            var t_transaction_day = moment(worksheet['L'+row] ? worksheet['L'+row].v: null).format('DD');
            var t_type = worksheet['M'+row] ? worksheet['M'+row].v: null;
            var t_transaction_month = worksheet['N'+row] ? worksheet['N'+row].v: null;
            var t_transaction_year = worksheet['O'+row] ? worksheet['O'+row].v: null;
            var t_cases = worksheet['U'+row] ? worksheet['U'+row].v: null;
            var t_bottles = worksheet['V'+row] ? worksheet['V'+row].v: null;
            var t_litres = worksheet['W'+row] ? worksheet['W'+row].v: null;
            
            // var t_code = worksheet['X'+row] ? worksheet['X'+row].v : null;
            var period = worksheet['AB'+row] ? worksheet['AB'+row].v : null;

            var t_sql = "insert into tb_transactions ( \
                    product_id, \
                    merchant_id, \
                    profile_id, \
                    sale, \
                    cases, \
                    bottles, \
                    litres, \
                    transaction_year, \
                    transaction_month, \
                    transaction_day, \
                    transaction_type, \
                    period \
                ) \
                values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) \
                ON CONFLICT (product_id) \
                DO UPDATE SET product_id=EXCLUDED.product_id RETURNING transaction_id";
            var t_sqlres = plv8.execute(t_sql,
                product_id,
                merchant_id,
                profile_id,
                t_sale,
                t_cases,
                t_bottles,
                t_litres,
                t_transaction_year,
                t_transaction_month,
                t_transaction_day,
                t_type,
                period
            );

            var transaction_id = t_sqlres[0].transaction_id;
    	}

    	row++;
    }
	}

	return result;

$$ LANGUAGE plv8;