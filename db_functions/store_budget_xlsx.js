create or replace function store_budget_xlsx(input json) returns JSON as
$$
	if(!plv8.ufn){
	  var sup = plv8.find_function("plv8_startup");
	  sup();
	}

	var result = {
        http_code: 200, message: 'Wine list data stored', data: {
        last_names: []
    }}

	// var d_sql = `delete from tb`;

	var worksheet = input;
	var row = 2;
	var insert_count = 0;

	for (var key in worksheet) {
        if (worksheet.hasOwnProperty(key)) {
            var master_merchant_id = 0;
            var account = '';
        	if(worksheet['C'+row]){
        		var jdata = {};

                var merchant_id = 0;

                if(worksheet['C'+row].v != account){
                    account = worksheet['C'+row].v;

                    var m_sql = `select merchant_id from tb_merchant where account = $1;`;
                    var m_sqlres = plv8.execute(m_sql,account);
                    if(m_sqlres.length == 0){

                    // PROVINCE
                    var province_name = worksheet['R'+row] ? worksheet['R'+row].v : 'Other';
                    var pr_sql = "insert into tb_province (province_name) values ($1) \
                        ON CONFLICT (province_name) DO UPDATE SET province_name=EXCLUDED.province_name RETURNING province_id";
                    var pr_sqlres = plv8.execute(pr_sql, province_name);

                    var province_id = pr_sqlres[0].province_id;

                    // REGION
                    var region_name = worksheet['S'+row] ? worksheet['S'+row].v : 'Other';
                    var r_sql = "insert into tb_region (region_name, province_id) values ($1,$2) \
                        ON CONFLICT (region_name) DO UPDATE SET region_name=EXCLUDED.region_name RETURNING region_id";
                    var r_sqlres = plv8.execute(r_sql, province_name, province_id);

                    var region_id = r_sqlres[0].region_id;

                    // MERCHANT GROUP
                    var group_name = worksheet['T'+row] ? worksheet['T'+row].v : 'Other';
                    var g_sql = "insert into tb_merchant_group (group_name) values ($1) \
                        ON CONFLICT (group_name) DO UPDATE SET group_name=EXCLUDED.group_name RETURNING merchant_group_id";
                    var g_sqlres = plv8.execute(g_sql, group_name);

                    var merchant_group_id = g_sqlres[0].merchant_group_id;

                    var merchant_name = worksheet['D'+row] ? worksheet['D'+row].v : 'Other';
                    var code = worksheet['A'+row] ? worksheet['A'+row].v : 'Other';;
                    var account = worksheet['C'+row] ? worksheet['C'+row].v : 'Other';

                    var m_sql = "insert into tb_merchant (merchant_name,province_id,region_id,merchant_group_id,code,account) \
                        values ($1,$2,$3,$4,$5,$6) \
                        ON CONFLICT (merchant_name) \
                        DO UPDATE SET merchant_name=EXCLUDED.merchant_name RETURNING merchant_id";
                    var m_sqlres = plv8.execute(m_sql, merchant_name, province_id, region_id, merchant_group_id,code,account);

                    merchant_id = m_sqlres[0].merchant_id;
                    
                    // REP PROFILE
                    var profile_jdata = jdata;
                    // profile_jdata.email_token = plv8.ufn.generateUUID();
                    profile_jdata.email_token = '1234';

                    var rep_name = worksheet['F'+row] ? worksheet['F'+row].v : 'Other';

                    var names = rep_name.split(' ');
                    var first_name = names[0];
                    names.splice(0,1);
                    var last_name = names.join(' ');

                    result.data.last_names.push(last_name)

                    // var email = worksheet['O'+row] ? worksheet['O'+row].v : null;
                    var rep_code = worksheet['E'+row] ? worksheet['E'+row].v : 'Other';
                    var p_sql = "insert into tb_profile (rep_code,rep_name, first_name, last_name) values ($1,$2,$3,$4) \
                        ON CONFLICT (rep_code) DO UPDATE SET rep_code=EXCLUDED.rep_code RETURNING profile_id";
                    var p_sqlres = plv8.execute(p_sql, rep_code, rep_name, first_name, last_name);

                    var profile_id = p_sqlres[0].profile_id;

                    // merchant_profile_map
                    var p_sql = "insert into tb_merchant_profile_map (merchant_id, profile_id) values ($1,$2) \
                        ON CONFLICT (merchant_id,profile_id) DO UPDATE SET merchant_id=EXCLUDED.merchant_id RETURNING merchant_profile_id";
                    var p_sqlres = plv8.execute(p_sql, merchant_id, profile_id);

                    }else{
                        merchant_id = m_sqlres[0].merchant_id
                    }
                    master_merchant_id = merchant_id;
                }

        		// BUDGET
                var budget_month = worksheet['Z'+row] ? worksheet['Z'+row].v: null;
                var budget_amount = worksheet['AI'+row] ? worksheet['AI'+row].v: null;
                var str = worksheet['AB'+row] ? worksheet['AB'+row].v: 'aOther';
                var budget_period = str.substr(1,(str.length-1));

        		var wf_sql = "insert into tb_budget (merchant_id,budget_month, budget_amount, budget_period) values ($1,$2,$3,$4) \
        			ON CONFLICT (merchant_id,budget_month) DO UPDATE SET merchant_id=EXCLUDED.merchant_id RETURNING budget_id;";
        		var wf_sqlres = plv8.execute(wf_sql, master_merchant_id, budget_month, budget_amount, budget_period);

        		var wine_farm_id = wf_sqlres[0].wine_farm_id;
        	}

        	row++;
        }
	}

	return result;

$$ LANGUAGE plv8;