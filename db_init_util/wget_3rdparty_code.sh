#In DB Modules
wget http://underscorejs.org/underscore.js
wget https://raw.github.com/adunstan/plv8-jpath/master/lib/plv8-jpath.js
wget http://momentjs.com/downloads/moment.js

#======== Previously =============
#http://adpgtech.blogspot.co.za/2013/03/loading-useful-modules-in-plv8.html

wget http://underscorejs.org/underscore-min.js
wget http://momentjs.com/downloads/moment.min.js

\set moment_file `cat moment.min.js`
insert into plv8_modules values ('moment',true,:'moment_file');
