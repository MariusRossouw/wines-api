# wines-api
Wines api repo

# no development allowed on Master branch

all developemnt needs to be done in dev-master branch.
additional brances can be created from dev-master

Only production ready code allowed to be merged with master

Platforms will create relelases from master branch to deploy to prod

# Dev-Ops
 - when npm intall
    npm install phantomjs-prebuilt@2.1.7 --ignore-scripts --save

 - create dir
    pdf_docs
    uploads

- Install extentions for postgres
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


Upload Sample Data -  Details
Column A - Channel
	Merchant belongs to a channel
Column B - Dont import column B
Column M - Type of transaction
Column P - Dont import
Column Q - Dont import
Column X - Product Classification
Column Y - Dont Import
Column H - 1st 2 letter  = Farm, Rest is Product Specifics
Column G - ItemCode == Product Code
Column H - All Product info separated by space
Farm/category/type/name/cultivar/vintage/special/bottle size/volume/case packing -> if 3 empty spaces == empty field




Budget
Per merchant per maand


