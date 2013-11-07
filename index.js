module.exports = dbchange;

var events = require('events'),
    util = require("util"),
    url = require('url'),
    request = require('request'),
    semver = require('semver'),
    difference = require('lodash.difference');


function dbchange(couch_url) {
    var me = this,
        modes = {
            changes: changes,
            poll: poll
        },
        current_dbs,
        interval;

    events.EventEmitter.call(this);

    all_dbs(function(err, db_list){
        current_dbs = db_list;
        me.emit('init', current_dbs);
    });

    poll_mode(function(err, mode){
        modes[mode]();
    });

    function changes() {
        var changes_url = url.resolve(couch_url, '_db_updates'),
            feed = request({
                url: changes_url,
                method: "GET",
                qs: {
                    feed: 'continuous'
                }
            });

        feed.on('error', function(er) {
            console.log('feed err', er);
        });

        feed.on('data', function(change) {
            try {
                var json = JSON.parse(change.toString());

                me.emit("data", json);
            } catch(e) {}
        });

        feed.on('end', function(){
            console.log('ended');
        })
    }

    function poll(){
        interval = setInterval(function(){
            all_dbs(function(err, dbs){
                var deleted = difference(current_dbs, dbs);
                var created = difference(dbs, current_dbs);
                deleted.forEach(function(db){ me.emit('data', {type: 'deleted', db_name: db}) });
                created.forEach(function(db){ me.emit('data', {type: 'created', db_name: db}) });
                current_dbs = dbs;
            });
        }, 3000);
    }

    function poll_mode(cb) {
        request({url: couch_url, json: {}}, function(err, resp, body){
            if (err) return cb(err);
            if (semver.gte(body.version, '1.4.0')) return cb(null, 'changes');
            return cb(null, 'poll');
        })
    }

    function all_dbs(cb) {
        var all_dbs_url = url.resolve(couch_url, '_all_dbs');
        request({url: all_dbs_url, json: {}}, function(err, resp, body){
            if (err) return cb(err);
            return cb(null, body);
        });
    }

}

util.inherits(dbchange, events.EventEmitter);
