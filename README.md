Follow DB Updates
=================

CouchDB 1.4.0 introduced the `_db_updates` endpoint for watching for created and deleted databases.
This module makes it easy to consume this endpoint, and provides a poll based pollyfill for older
versions of CouchDB

Install
-------

    npm install follow-db-updates


Usage
-----

    var DBUpdates = require('follow-db-updates');
    var changes = new DBUpdates('http://admin:pass@localhost:5984');



    changes.on('init', function(db_list){
        // on init we provide a list of all the current databases
    })

    changes.on('data', function(change){
        console.log(change); // change is one of the following
                             // { type: 'created', db_name: 'aaaaa' }
                             // { type: 'deleted', db_name: 'aaaaa' }
    })

