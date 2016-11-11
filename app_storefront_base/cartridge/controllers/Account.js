'use strict';

var server = require('server');
var locale = require('~/cartridge/scripts/middleware/locale');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var ShippingMgr = require('dw/order/ShippingMgr');
var AccountModel = require('~/cartridge/models/account');
var AddressModel = require('~/cartridge/models/address');
var OrderModel = require('~/cartridge/models/order');
var ShippingModel = require('~/cartridge/models/shipping');
var Totals = require('~/cartridge/models/totals');
var Transaction = require('dw/system/Transaction');
var CustomerMgr = require('dw/customer/CustomerMgr');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');

/**
 * Creates an account model for the current customer
 * @param {Object} req - local instance of request object
 * @returns {Object} a plain object of the current customer's account
 */
function getModel(req) {
    var orderModel;
    var preferredAddressModel;

    if (!req.currentCustomer.profile) {
        return null;
    }

    var customerNo = req.currentCustomer.profile.customerNo;
    var customerOrders = OrderMgr.searchOrders(
        'customerNo={0} AND status!={1}',
        'creationDate desc',
        customerNo,
        Order.ORDER_STATUS_REPLACED
	);

    var order = customerOrders.first();

    if (order) {
        var defaultShipment = order.defaultShipment;
        var ordershippingAdress = defaultShipment.shippingAddress;
        var shippingAddressModel = new AddressModel(ordershippingAdress);
        var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(defaultShipment);
        var shippingModel = new ShippingModel(
            defaultShipment,
            shipmentShippingModel,
            shippingAddressModel
        );
        var allProducts = order.allProductLineItems;
        var orderTotals = new Totals(order);
        orderModel = new OrderModel(order, shippingModel, null, orderTotals, allProducts);
    } else {
        orderModel = null;
    }

    if (req.currentCustomer.addressBook.preferredAddress) {
        preferredAddressModel = new AddressModel(req.currentCustomer.addressBook.preferredAddress);
    } else {
        preferredAddressModel = null;
    }

    return new AccountModel(req.currentCustomer, preferredAddressModel, orderModel);
}

server.get('Show', locale, function (req, res, next) {
    var accountModel = getModel(req);

    if (accountModel) {
        res.render('account/accountdashboard', getModel(req));
    } else {
        res.redirect(URLUtils.url('Login-Show'));
    }
    next();
});

server.post('Login', locale, server.middleware.https, function (req, res, next) {
    var email = req.form.loginEmail;
    var password = req.form.loginPassword;
    var rememberMe = req.form.loginRememberMe
        ? req.form.loginRememberMe
        : false;

    var authenticatedCustomer;
    Transaction.wrap(function () {
        authenticatedCustomer = CustomerMgr.loginCustomer(email, password, rememberMe);
    });
    if (authenticatedCustomer && authenticatedCustomer.authenticated) {
        // TODO clear form elements?
        res.redirect(URLUtils.url('Account-Show'));
    } else {
        res.render('/account/login', {
            navTabValue: 'login',
            loginFormError: true
        });
    }
    next();
});

server.get('Registration', locale, server.middleware.https, function (req, res, next) {
    var profileForm = server.forms.getForm('profile');

    // TODO clear form
    res.render('/account/register', {
        profileForm: profileForm,
        navTabValue: 'register'
    });
    next();
});

server.post('SubmitRegistration', locale, server.middleware.https, function (req, res, next) {
    var registrationForm = server.forms.getForm('profile');

    // form validation
    if (registrationForm.customer.email.value !== registrationForm.customer.emailconfirm.value) {
        registrationForm.customer.email.valid = false;
        registrationForm.customer.emailconfirm.valid = false;
        registrationForm.customer.emailconfirm.error =
            Resource.msg('error.message.mistmatch.email', 'forms', null);
        registrationForm.valid = false;
    }

    if (registrationForm.login.password.value !== registrationForm.login.passwordconfirm.value) {
        registrationForm.login.password.valid = false;
        registrationForm.login.passwordconfirm.valid = false;
        registrationForm.login.passwordconfirm.error =
            Resource.msg('error.message.mistmatch.password', 'forms', null);
        registrationForm.valid = false;
    }

    // setting variables for the BeforeComplete function
    var registrationFormObj = {
        firstName: registrationForm.customer.firstname.value,
        lastName: registrationForm.customer.lastname.value,
        email: registrationForm.customer.email.value,
        emailConfirm: registrationForm.customer.emailconfirm.value,
        password: registrationForm.login.password.value,
        passwordConfirm: registrationForm.login.passwordconfirm.value,
        validForm: registrationForm.valid,
        form: registrationForm
    };

    if (registrationForm.valid) {
        res.setViewData(registrationFormObj);

        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            // getting variables for the BeforeComplete function
            var registrationForm = res.getViewData(); // eslint-disable-line

            if (registrationForm.validForm) {
                var login = registrationForm.email;
                var password = registrationForm.password;
                var authenticatedCustomer;

                // attempt to create a new user and log that user in.
                try {
                    Transaction.wrap(function () {
                        var newCustomer = CustomerMgr.createCustomer(login, password);

                        if (newCustomer) {
                            // assign values to the profile
                            var newCustomerProfile = newCustomer.getProfile();
                            authenticatedCustomer =
                                CustomerMgr.loginCustomer(login, password, false);
                            newCustomerProfile.firstName = registrationForm.firstName;
                            newCustomerProfile.lastName = registrationForm.lastName;
                            newCustomerProfile.email = registrationForm.email;
                        }

                        if (authenticatedCustomer === undefined) {
                            registrationForm.validForm = false;
                            registrationForm.form.customer.email.valid = false;
                            registrationForm.form.customer.emailconfirm.valid = false;
                        }
                    });
                } catch (e) {
                    registrationForm.validForm = false;
                    registrationForm.form.customer.email.valid = false;
                    registrationForm.form.customer.emailconfirm.valid = false;
                    registrationForm.form.customer.emailconfirm.error =
                        Resource.msg('error.message.username.taken', 'forms', null);
                }
            }

            if (registrationForm.validForm) {
                res.redirect(URLUtils.url('Account-Show'));
            } else {
                res.render('/account/register', {
                    profileForm: registrationForm.form,
                    navTabValue: 'register',
                    registrationFormError: !registrationForm.validForm
                });
            }
        });
    } else {
        res.render('/account/register', {
            profileForm: registrationForm,
            navTabValue: 'register',
            registrationFormError: !registrationForm.validForm
        });
    }
    next();
});

module.exports = server.exports();
