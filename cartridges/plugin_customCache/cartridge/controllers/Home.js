'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var CustomObjMgr = require('dw/object/CustomObjectMgr');
var CacheMgr = require('dw/system/CacheMgr');

server.get('Show', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    
    //pulliung the JSON object from custom object & setting it in response object
    
    var configJSONValue = loadFromCache();
    if(configJSONValue ){
        
        renderObject = {"configJSONValue": configJSONValue};
        res.render('/home/homePage',renderObject);
    }else{
        res.render('/home/homePage');
    }
    
    next();
}, pageMetaData.computedPageMetaData);

server.get('ErrorNotFound', function (req, res, next) {
    res.setStatusCode(404);
    res.render('error/notFound');
    next();
});

function loadFromCache(){
    var cache = CacheMgr.getCache( 'JSONConfig' );
    return cache.get( "JSONConfigValue", function loadSiteConfiguration() {return cacheLoader();} );
}

function cacheLoader(){
    var configJsonObject = CustomObjMgr.getCustomObject("CustomCacheDemo", "1");
    if(configJsonObject && configJsonObject.custom.JSONConfig){
        return configJsonObject.custom.JSONConfig;
    }else{
        return;
    }
}

module.exports = server.exports();
