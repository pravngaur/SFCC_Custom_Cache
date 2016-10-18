'use strict';

var server = require('server');
var locale = require('~/cartridge/scripts/middleware/locale');
var URLUtils = require('dw/web/URLUtils');
var ProductFactory = require('../scripts/factories/product');
var Resource = require('dw/web/Resource');

/**
 * @typedef ProductDetailPageResourceMap
 * @type Object
 * @property {String} global_availability - Localized string for "Availability"
 * @property {String} label_instock - Localized string for "In Stock"
 * @property {String} global_availability - Localized string for "This item is currently not
 *     available"
 * @property {String} info_selectforstock - Localized string for "Select Styles for Availability"
 */

/**
 * Generates a map of string resources for the template
 *
 * @returns {ProductDetailPageResourceMap} - String resource map
 */
function getResources() {
    return {
        label_instock: Resource.msg('label.instock', 'common', 'In Stock'),
        label_allnotavailable: Resource.msg('label.allnotavailable', 'common',
            'This item is currently not available'),
        info_selectforstock: Resource.msg('info.selectforstock', 'product',
            'Select Styles for Availability')
    };
}

server.get('Show', locale, function (req, res, next) {
    var params = req.querystring;
    var product = ProductFactory.get(params);
    var addToCartUrl = URLUtils.url('Cart-AddProduct');

    res.render('product/detail.isml', {
        CurrentPageMetaData: {
            title: product.name
        },
        product: product,
        addToCartUrl: addToCartUrl,
        resources: getResources()
    });

    next();
});

server.get('Variation', locale, function (req, res, next) {
    var params = req.querystring;
    res.json({
        product: ProductFactory.get(params),
        resources: getResources()
    });

    next();
});

server.get('ShowTile', locale, function (req, res, next) {
    // The req parameter has a property called querystring. In this use case the querystring could
    // have the following:
    // pid - the Product ID
    // compare - boolean to determine if the compare feature should be shown in the tile.
    // reviews - boolean to determine if the reviews should be shown in the tile.
    // swatches - boolean to determine if the swatches should be shown in the tile.
    //
    // pview - string to determine if the product factory returns a model for
    //         a tile or a pdp/quickview display
    var productTileParams = {
        pid: req.querystring.pid,
        compare: req.querystring.compare,
        reviews: req.querystring.reviews,
        swatches: req.querystring.swatches,
        pview: 'tile'
    };

    var product = ProductFactory.get(productTileParams);
    res.render('product/gridTile.isml', {
        product: product
    });

    next();
});

module.exports = server.exports();
