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

    		// FARM
    		var farm_name = worksheet['A'+row].v;

    		var wf_sql = "insert into tb_wine_farm (farm_name, jdata) values ($1,$2) \
    			ON CONFLICT (farm_name) DO UPDATE SET farm_name=EXCLUDED.farm_name RETURNING wine_farm_id;";
    		var wf_sqlres = plv8.execute(wf_sql, farm_name, jdata);

    		var wine_farm_id = wf_sqlres[0].wine_farm_id;

            // PRODUCT TYPE
    		var product_type = worksheet['B'+row].v;
    		var pt_sql = "insert into tb_product_type (product_type,jdata) values ($1,$2) \
    			ON CONFLICT (product_type) DO UPDATE SET product_type=EXCLUDED.product_type RETURNING product_type_id";
    		var pt_sqlres = plv8.execute(pt_sql, product_type, jdata);

    		var product_type_id = pt_sqlres[0].product_type_id;

            // PRODUCT
    		var item_code = worksheet['C'+row] ? worksheet['C'+row].v : null;
    		var description = worksheet['D'+row] ? worksheet['D'+row].v : null;
            var product_name = worksheet['E'+row] ? worksheet['E'+row].v : null;
            var color = worksheet['F'+row] ? worksheet['F'+row].v : null;
            var vintage = worksheet['G'+row] ? worksheet['G'+row].v : null;
    		var size = worksheet['H'+row] ? worksheet['H'+row].v : null;

    		var p_sql = "insert into tb_product (product_type_id,item_code,description,size,product_name,vintage,jdata,color) \
    			values ($1,$2,$3,$4,$5,$6,$7,$8) \
    			ON CONFLICT (item_code) DO UPDATE SET item_code=EXCLUDED.item_code RETURNING product_id";
    		var p_sqlres = plv8.execute(p_sql,product_type_id,item_code,description,size,product_name,vintage,jdata,color);

    		var product_id = p_sqlres[0].product_id;

            // PRODUCT/FARM MAP
    		var pt_sql = "insert into tb_wine_farm_product_map (wine_farm_id,product_id) values ($1,$2) \
    			ON CONFLICT (wine_farm_id,product_id) DO UPDATE SET wine_farm_id=EXCLUDED.wine_farm_id RETURNING wine_farm_product_id";
    		var pt_sqlres = plv8.execute(pt_sql, wine_farm_id, product_id);

            // PROVINCE
            var province_name = worksheet['I'+row] ? worksheet['I'+row].v : null;
            var pr_sql = "insert into tb_province (province_name) values ($1) \
                ON CONFLICT (province_name) DO UPDATE SET province_name=EXCLUDED.province_name RETURNING province_id";
            var pr_sqlres = plv8.execute(pr_sql, province_name);

            var province_id = pr_sqlres[0].province_id;

            // DIVISION
            var division_name = worksheet['J'+row] ? worksheet['J'+row].v : null;
            var d_sql = "insert into tb_division (division_name) values ($1) \
                ON CONFLICT (division_name) DO UPDATE SET division_name=EXCLUDED.division_name RETURNING division_id";
            var d_sqlres = plv8.execute(d_sql, province_name);

            var division_id = d_sqlres[0].division_id;
            
            // REGION
            var region_name = worksheet['K'+row] ? worksheet['K'+row].v : null;
            var r_sql = "insert into tb_region (region_name, province_id) values ($1,$2) \
                ON CONFLICT (region_name) DO UPDATE SET region_name=EXCLUDED.region_name RETURNING region_id";
            var r_sqlres = plv8.execute(r_sql, province_name, province_id);

            var region_id = r_sqlres[0].region_id;
            
            // MERCHANT GROUP
            var group_name = worksheet['M'+row] ? worksheet['M'+row].v : null;
            var g_sql = "insert into tb_merchant_group (group_name) values ($1) \
                ON CONFLICT (group_name) DO UPDATE SET group_name=EXCLUDED.group_name RETURNING merchant_group_id";
            var g_sqlres = plv8.execute(g_sql, group_name);

            var merchant_group_id = g_sqlres[0].merchant_group_id;
            
            // MERCHANT
            var merchant_name = worksheet['L'+row] ? worksheet['L'+row].v : null;
            var m_sql = "insert into tb_merchant (merchant_name,province_id,region_id,division_id,merchant_group_id) \
                values ($1,$2,$3,$4,$5) \
                ON CONFLICT (merchant_name) \
                DO UPDATE SET merchant_name=EXCLUDED.merchant_name RETURNING merchant_id";
            var m_sqlres = plv8.execute(m_sql, merchant_name, province_id, region_id, division_id, merchant_group_id);

            var merchant_id = m_sqlres[0].merchant_id;
            
            // REP PROFILE
            var profile_jdata = jdata;
            // profile_jdata.email_token = plv8.ufn.generateUUID();
            profile_jdata.email_token = '1234';

            var rep_name = worksheet['N'+row] ? worksheet['N'+row].v : null;
            var email = worksheet['O'+row] ? worksheet['O'+row].v : null;
            var rep_code = worksheet['P'+row] ? worksheet['P'+row].v : null;
            var p_sql = "insert into tb_profile (rep_code,rep_name, email) values ($1,$2,$3) \
                ON CONFLICT (rep_code) DO UPDATE SET rep_code=EXCLUDED.rep_code RETURNING profile_id";
            var p_sqlres = plv8.execute(p_sql, rep_code, rep_name, email);

            var profile_id = p_sqlres[0].profile_id;
            
            // TRANSACTION
            var t_sale = worksheet['Q'+row] ? worksheet['Q'+row].v: null;
            var t_cases = worksheet['R'+row] ? worksheet['R'+row].v: null;
            var t_bottles = worksheet['S'+row] ? worksheet['S'+row].v: null;
            var t_litres = worksheet['T'+row] ? worksheet['T'+row].v: null;
            var t_transaction_year = worksheet['U'+row] ? worksheet['U'+row].v: null;
            var t_transaction_month = worksheet['V'+row] ? worksheet['V'+row].v: null;
            var t_transaction_day = worksheet['W'+row] ? worksheet['W'+row].v: null;
            var t_code = worksheet['X'+row] ? worksheet['X'+row].v : null;

            var t_sql = "insert into tb_transactions ( \
                    product_id, \
                    merchant_id, \
                    profile_id, \
                    transaction_code, \
                    sale, \
                    cases, \
                    bottles, \
                    litres, \
                    transaction_year, \
                    transaction_month, \
                    transaction_day \
                ) \
                values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) \
                ON CONFLICT (transaction_code) \
                DO UPDATE SET transaction_code=EXCLUDED.transaction_code RETURNING transaction_id";
            var t_sqlres = plv8.execute(t_sql,
                product_id,
                merchant_id,
                profile_id,
                t_code,
                t_sale,
                t_cases,
                t_bottles,
                t_litres,
                t_transaction_year,
                t_transaction_month,
                t_transaction_day
            );

            var transaction_id = t_sqlres[0].transaction_id;
            


    	}

    	row++;
    }
	}

	return result;

$$ LANGUAGE plv8;