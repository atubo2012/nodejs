'use strict';

module.exports.insert = function(req,res,err){
    res.send('ok');
};

module.exports.findAll = function(req,res,err){
    res.render('index',{title:'findAll', Id:'findall'});
};


module.exports.detail = function(req,res,err){
    res.render('index',{title:'Detail',Id:req.params.Id});
};

module.exports.remove = function(req,res,err){
    res.send('ok');
};

module.exports.update = function(req,res,err){
    res.send('ok');
};