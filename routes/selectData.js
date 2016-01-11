/**
 * Created by luozhong on 16/1/5.
 * desc：抓取网页数据  对比
 */
var http = require("http");
var iconv = require('iconv-lite');
var cheerio = require('cheerio');
var superagent = require('superagent');
var getChannelList = require("./dbHelper").getChannelList;
var updateChannelStatus = require("./dbHelper").updateChannelStatus;

//获取数据
var getData = function(){
    var data = {
        skip: "",
        limit: ""
    };
    getChannelList(data, function (r) {
        var listData = r.data;

        for (var n = 0; n < listData.length; n++) {
            var everyObj = listData[n];//列表单条数据

            searchFuc(everyObj);
            //console.log(listData[0].domObj.descContain);
        }
    });
};

//去除空格(此处将空格变为一个)
var trim = function (str) {
    var result;
    var reg = /\s{2,}/g;
    result = str.replace(reg, " ");
    return result;
};

//整理标签class
var checkClass = function (className) {
    className = trim(className);
    className = className.replace(/^(\s|\u00A0)+/, '').replace(/(\s|\u00A0)+$/, '');//去除两边空格
    className = className == "" ? "" : "." + className;
    if (className != "") {
        className = className.split(" ");
        className = className.join(".");
    }

    return className;
};

//匹配元素
var params = {
    versionStatus: 1,
    descStatus: 1,
    iconStatus: 1,
    screenshotStatus: 1,
    time:new Date().getTime()
};
var checkEle = function (ele, res, everyObj) {
    var version = everyObj.version;
    var desc = everyObj.desc;

    if (ele == "descContain") {
        if (res != desc) {
            params.descStatus = 0;
        }
    }
    if (ele == "versionContain") {
        res = res.replace(/[^0-9]/ig, "");
        res = res.split("").join(".");
        if (version-0 != res-0) {
            params.versionStatus = 0;
        }
    }
    return params;

    //if(ele == "iconImgBox"){
    //
    //}
    //if(ele == "cutImgBox"){
    //
    //}

};
//搜索dom树
var searchDom = function (html, everyObj) {
    var domObj = JSON.parse(everyObj.domObj);//单个网站匹配的dom树
    var statusParams = {};
    var id = everyObj._id;

    var $ = cheerio.load(html);

    for (var i in domObj) {
        var seccondObj = domObj[i];
        var grapEle = seccondObj.grap.Ele;
        var grapClass = checkClass(seccondObj.grap.Class);
        var grapId = seccondObj.grap.Id == "" ? "" : "#" + seccondObj.grap.Id;

        var parEle = seccondObj.par.Ele;
        var parClass = checkClass(seccondObj.par.Class);
        var parId = seccondObj.par.Id == "" ? "" : "#" + seccondObj.par.Id;

        var selfEle = seccondObj.self.Ele;
        var selfClass = checkClass(seccondObj.self.Class);
        var selfId = seccondObj.self.Id == "" ? "" : "#" + seccondObj.self.Id;
        var selfIndex = seccondObj.self.index;

        //console.log(grapEle + grapId + grapClass + " " + parEle + parId + parClass + " " + selfEle + selfId + selfClass);
        //通过CSS selector来筛选数据
        $(grapEle + grapId + grapClass + " " + parEle + parId + parClass + " " + selfEle + selfId + selfClass).each(function (index, element) {
            if (index == selfIndex) {
                var resText = $(element).text();
                statusParams = checkEle(i, resText, everyObj);
            }
        });
    };

    statusParams._id = id;
    updateChannelStatus(statusParams, function () {

    });
};

//遍历网页
var searchFuc = function (obj) {
    var url = obj.channelUrl;//网站的地址
    superagent.get(url).end(function (err, res) {
        var html = res.text;
        //var $ = cheerio.load(html);
        searchDom(html, obj);
    });
};

module.exports = {
    startSearch:getData
};


