var mongoose = require("mongoose");
var tschema = new mongoose.Schema({
    name  : { type: String },
    age   : { type: Number, default:18 },
    gender: { type: Boolean, default: true },
    email : { type: String }
});
var db = mongoose.connect("mongodb://127.0.0.1:27017/test");
var TestModel = db.model("tdoc", tschema);

var TestEntity = new TestModel({
    name : "Lenka",
    age  : 36,
    email: "lenka@qq.com"
});
console.log(TestEntity.age); // 36
console.log(TestEntity.name); // Lenka

TestEntity.save(function(error,doc){
    if(error){
        console.log("error :" + error);
    }else{
        console.log(doc);
    }
});



//==================================

/**
 * 插入1条数据
 * db.person.insert({name:'wangxue',age:39});
 * 插入多条数据
 *  db.person.insert([{name:'Mary',age:21,status:'A'},{name:'Lucy',age:89,status:'A'},{name:'Jacky',age:30,status:'A'}]);
 *  查询全部数据中的5条。
 *  db.person.find().limit(5)
 *
 *  db.collection.find(criteria,projection); //criteria查询条件，相当于where，projection要反馈哪些列，用name:1设置，表示要显示
 *  db.person.find({age:{$gt:18}},{name:1,address:1})
 *  db.person.find({name:/^王/})   与like '王%'功能类似
 *  db.person.find({name:/王/})   与like '%王%'功能类似
 *
 *  db.person.update({age:{$gt:18}},{$set:{status:"A"}},{upsert:false,multi:true});
 *
 *  save只能对一个文档进行操作
 *  db.person.save({name:'Tony',age:12,gender:'man',status:'A'});
 *
 *  remove删除记录
 *  db.person.remove({status:'A'})
 *
 *  find查询时使用到运算符：
 *  大于($gt)、大于等于($gte)、小于($lt)、小于等于($lte)、不等于($ne)、包含于($in)、不包含于($nin)
 *  db.person.find({age:{$gt:40}})
 *  db.person.find({age:{$gt:40},name:{$ne:'Mary1'}})  //查询名字不是Mary1的大于40岁的人。
 *
 *  数组条件
 *  db.inventory.find( { tags: [ 'fruit', 'food', 'citrus' ] } ); //数组完全匹配
 *  db.inventory.find( { tags: 'fruit' } ); //单个元素匹配
 *  db.inventory.find( { 'tags.0' : 'fruit' } ); //数组中的特定index下标的额元素匹配
 *
 *  包含子文档的
 *  db.person.find({'addr.road':'dalian'})
 *
 *  包含子文档的保存
 *  db.person.save({
 *  name:'Tony',
 *  age:12,
 *  gender:'man',
 *  status:'A',
 *  addr:{road:'dalian',number:'123'} //地址是个自文档
 *  });
 *
 *  符合条件aand查询
 *  db.person.find({$and:[{name:'Lucy'},{age:{$lt:10000}}]})
 *  db.person.find({$and:[{age:{$gt:30}},{name:'Lucy'}]})
 *  db.person.find({$or:[{status:'A'},{age:30}]})
 *
 *  遍历游标
 *  var myCursor = db.inventory.find( { type: "food" } );
 *  var myDocument = myCursor.hasNext() ? myCursor.next() : null;
 *  if (myDocument) {
 *      var myItem = myDocument.item;
 *      print(tojson(myItem));
 *  }
 *
 *  通过游标遍历
 *  var myCursor =  db.inventory.find( { type: "food" } );
 *  myCursor.forEach(printjson);
 *
 *  只显示某些列
 *  db.person.find({},{name:1,"addr.road":1})
 *
 *  翻页算法：
 *  http://www.cnblogs.com/linhan/p/4248679.html
 */
//



var mongoose = require("mongoose");
var db = mongoose.connect("mongodb://127.0.0.1:27017/test");
var TestSchema = new mongoose.Schema({
    name  : { type: String },
    age   : { type: Number, default:18 },
    gender: { type: Boolean, default: true },
    email : { type: String }
});
var TestModel = db.model("test1", TestSchema );

var TestEntity = new TestModel({
    name : "Lenka",
    age  : 36,
    gender : true,
    email: "lenka@qq.com"
});

TestEntity.save(function(error,doc){
    if(error){
        console.log("error :" + error);
    }else{
        console.log(doc);
    }
});

TestModel.find({}, function (error, docs) {
    console.log(docs);
});

/** Model保存数据
 * var mongoose = require("mongoose");
 var db = mongoose.connect("mongodb://127.0.0.1:27017/test");
 var TestSchema = new mongoose.Schema({
	  name : { type:String },
	  age  : { type:Number, default:0 },
	  email: { type:String },
	  time : { type:Date, default:Date.now }
});
 var TestModel = db.model("test1", TestSchema );

 TestModel.create({
  name:"model_create",
  age:26,
  email:"atubo@aaa.com"
}, function(error,doc){
    console.log(doc);
 });
 *
 * **/


/**Entity保存数据
 * var Entity = new TestModel({name:"你好",age:28,email:"aaa@cib.com.cn"});
 Entity.save(function(error,doc){
 console.log(doc);
});
 *
 * **/


