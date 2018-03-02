
async.series(
    {
        disthtml:function(cb){

            cb(getWebData(url,disthtml),disthtml);
        },
        dists:function(cb){
            cb(null,parseDist(disthtml));
        },
        zonehtml:function(cb){
            cb(null,'zonehtml');
        },
        zones:function(cb){
            cb(null,'zongs');
        }
    },function(err,results) {
        console.log(results);
    }

);

