var express = require('express');
var app = express();
var path = require('path');
var session = require('express-session');

var bodyParser = require('body-parser');

// 设定views变量，意为视图存放的目录
app.set('views', path.join(__dirname, 'public'));
//app.set('views', path.join(__dirname, 'JSProteced/app'));

// 设定view engine变量，意为网页模板引擎
//app.set('view engine', 'ejs');
app.set('view engine', 'html');
app.engine('.html', require('ejs').__express);

app.use(session({
    secret:'secret',
    cookie:{
        maxAge:1000*60*30
    }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// 设定静态文件目录，比如本地文件
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(path.join(__dirname, 'JSProteced')));
require('./routes')(app);

app.get('/', function (req, res) {
    res.render('login');
});

app.listen(3001, function () {
    console.log("start...");
});