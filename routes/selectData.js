/**
 * Created by luozhong on 16/1/5.
 * desc：抓取网页数据  对比
 */
var http = require("http");
var iconv = require('iconv-lite');
var cheerio = require('cheerio');
var superagent = require('superagent');
var async = require('async');
var images = require("images");

var getChannelList = require("./dbHelper").getChannelList;
var updateChannelStatus = require("./dbHelper").updateChannelStatus;
var getChannelBaseData = require("./dbHelper").getChannelBaseData;


var baseData = {};//基础数据
var listLength = 0;//抓取网站总数
var updatePageNo = 0;//被更新的网页数

//获取数据
var getData = function () {
    getChannelBaseData({}, function (r) {
        if (r.status == "200") {
            baseData = r.data[0];

            var data = {
                skip: "",
                limit: ""
            };
            getChannelList(data, function (r) {
                var listData = r.data;
                updatePageNo = 0;
                listLength = listData.length;
                //for (var n = 0; n < listData.length; n++) {
                //    var everyObj = listData[n];//列表单条数据
                //
                //    searchFuc(everyObj);
                //    //console.log(listData[0].domObj.descContain);
                //}
                searchFuc(listData, 0, listLength);
            });
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
        className = className.split(" ")[0];
        //console.log(className[0]);
        //className = className.join(".");
        //className = "."+grapClass.split(".")[1];
    }

    return className;
};

//压缩图片
var compressionImg = function (url) {
    //gm(url).resize(240, 240).noProfile().write('/uploadFile/resize.jpeg', function (err) {
    //    //console.log(err);
    //    if (!err) console.log('done');
    //});
};

//匹配元素
var params = {
    versionStatus: 1,
    descStatus: 1,
    iconStatus: 1,
    screenshotStatus: 1,
    version: "",
    time: new Date().getTime()
};
var checkEle = function (ele, res, everyObj) {
    var version = baseData.version;
    var icon = baseData.icon;
    var desc = baseData.desc;

    //if (ele == "descContain") {
    //    if (res != desc) {
    //        params.descStatus = 0;
    //    } else {
    //        params.descStatus = 1;
    //    }
    //}
    //对比版本号
    if (ele == "versionContain") {
        //res = res.replace(/[^0-9]/ig, "");
        //res = res.split("").join(".");

        var reg1 = /[2-9]\.\d\.\d/g;
        var reg2 = /[2-9]\.\d/g;
        //var version = this.innerText.replace(/[^0-9]/ig, "");
        var relVersion = res.match(reg1);
        if (!relVersion) {
            relVersion = res.match(reg2);
        }
        if (relVersion) {
            relVersion = relVersion[0];
        }

        params.version = relVersion;

        if (version != relVersion) {
            params.versionStatus = 0;
        } else {
            params.versionStatus = 1;
        }

        console.log(relVersion, version, params.versionStatus);
    }

    if (ele == "iconImgBox") {
        //compressionImg(icon)
    }

    return params;

    //if(ele == "cutImgBox"){
    //
    //}

};

//搜索dom树
var searchDom = function (html, everyObj, callback) {
    var domObj = JSON.parse(everyObj.domObj);//单个网站匹配的dom树
    var statusParams = {};
    var id = everyObj._id;

    var $ = cheerio.load(html);

    for (var i in domObj) {
        //    console.log("--",i);
        var seccondObj = domObj[i];
        var grapEle = seccondObj.grap.Ele;
        var grapClass = checkClass(seccondObj.grap.Class);
        var grapId = seccondObj.grap.Id == "" ? "" : "#" + seccondObj.grap.Id;

        var parEle = seccondObj.par.Ele;
        var parClass = checkClass(seccondObj.par.Class);
        var parId = seccondObj.par.Id == "" ? "" : "#" + seccondObj.par.Id;
        var parIndex = seccondObj.par.parIndex;

        var selfEle = seccondObj.self.Ele;
        var selfClass = checkClass(seccondObj.self.Class);
        var selfId = seccondObj.self.Id == "" ? "" : "#" + seccondObj.self.Id;
        var selfIndex = seccondObj.self.index;

        var grapSelect = grapEle + (grapId ? grapId : grapClass);
        var parSelect = parEle + (parId ? parId : parClass);
        var selfSelect = selfEle + (selfId ? selfId : selfClass);
        //console.log(grapEle + grapId + grapClass + " " + parEle + parId + parClass + " " + selfEle + selfId + selfClass);
        //通过CSS selector来筛选数据
        var s1 = grapSelect + " " + parSelect + " " + selfSelect;
        var s2 = grapSelect + " " + parSelect;//筛选父元素
        //console.log("----"+$(s1).length);

        //当父元素没class的时候  使用parIndex精准定位
        //console.log("--",s2);
        console.log(selfId);
        //当子元素存在id时则直接取值
        if (selfId) {
            var resText = $(selfId).text();
            statusParams = checkEle(i, resText, everyObj);
        } else {
            if (parClass == "") {
                //console.log(s2.length);
                $(s2).each(function (index, element) {
                    if (index == parIndex) {
                        $(element).each(function (index, element) {
                            var resText = "";
                            //if(selfSelect.indexOf("#")>=0||(selfSelect&&$(selfSelect).length ==1)){
                            //    resText = $(element).text();
                            //}else

                            //console.log(index, selfIndex);
                            //console.log("-----",s1,$(s1));
                            if ($(s1).length == 1) {
                                resText = $(element).text();
                                statusParams = checkEle(i, resText, everyObj);
                            } else {
                                if (index == selfIndex) {
                                    resText = $(element).text();
                                    //console.log($(element));
                                    statusParams = checkEle(i, resText, everyObj);
                                }
                            }
                        });
                    }
                })
            } else {
                console.log(s1);
                $(s1).each(function (index, element) {
                    var resText = "";
                    //if(selfSelect.indexOf("#")>=0||(selfSelect&&$(selfSelect).length ==1)){
                    //    resText = $(element).text();
                    //}else

                    //console.log(index, selfIndex);
                    if ($(s1).length == 1) {
                        resText = $(element).text();
                        statusParams = checkEle(i, resText, everyObj);
                    } else {
                        //console.log(index, selfIndex);
                        if (index == selfIndex) {
                            resText = $(element).text();
                            //console.log($(element));
                            statusParams = checkEle(i, resText, everyObj);
                        }
                    }
                });
            }
        }
    }

    statusParams._id = id;
    updateChannelStatus(statusParams, function () {
        updatePageNo++;
        console.log(updatePageNo);
        callback && callback();
        if (updatePageNo == listLength) {

        }
    });
};

var comperaImage = function () {
    images("uploadFile/share.jpg")                     //加载图像文件
        .size(8)                          //等比缩放图像到400像素宽
        .save("output.jpg", {               //Save the image to a file,whih quality 50
            quality: 50                    //保存图片到文件,图片质量为50
        });
};

//遍历网页
var searchFuc = function (obj, i) {
    comperaImage();
    return


    if (i > obj.length - 1) {
        return
    }
    var url = obj[i].channelUrl;//网站的地址
    //
    //if(url!="http://www.muzhiwan.com/vStudio.Android.Camera360.html"){
    //    i++;
    //    searchFuc(obj,i);
    //    return
    //}
    //if(url!="http://apkhome.org/camera360-ultimate-7-0-4/"){
    //    return
    //}

    superagent.get(url).end(function (err, res) {
        console.log(url);
        if (res) {
            var html = res.text;
            //var $ = cheerio.load(html);
            searchDom(html, obj[i], function () {
                i++;
                searchFuc(obj, i);
            });
        } else {
            console.log("抓取错误", url);
        }
    });
};

module.exports = {
    startSearch: getData
};


