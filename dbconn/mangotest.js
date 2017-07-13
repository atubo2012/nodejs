var mongoose = require("mongoose");
var tschema = new mongoose.Schema({
    name: {type: String},
    age: {type: Number, default: 18},
    gender: {type: Boolean, default: true}
});
var db = mongoose.connect("mongodb://127.0.0.1:27017/test");
var TestModel = db.model("test1", tschema);