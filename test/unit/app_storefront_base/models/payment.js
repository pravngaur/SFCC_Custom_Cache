'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var ArrayList = require('../../../mocks/dw.util.Collection');

var paymentMethods = new ArrayList([
    {
        ID: 'GIFT_CERTIFICATE',
        name: 'Gift Certificate'
    },
    {
        ID: 'CREDIT_CARD',
        name: 'Credit Card'
    }
]);

var paymentCards = new ArrayList([
    {
        cardType: 'Visa',
        name: 'Visa',
        UUID: 'some UUID'
    },
    {
        cardType: 'Amex',
        name: 'American Express',
        UUID: 'some UUID'
    },
    {
        cardType: 'Master Card',
        name: 'MasterCard'
    },
    {
        cardType: 'Discover',
        name: 'Discover'
    }
]);

var paymentInstruments = new ArrayList([
    {
        creditCardNumberLastDigits: '1111',
        creditCardHolder: 'The Muffin Man',
        creditCardExpirationYear: 2018,
        creditCardType: 'Visa',
        maskedCreditCardNumber: '************1111',
        paymentMethod: 'CREDIT_CARD',
        creditCardExpirationMonth: 1,
        paymentTransaction: {
            amount: {
                value: 0
            }
        }
    },
    {
        giftCertificateCode: 'someString',
        maskedGiftCertificateCode: 'some masked string',
        paymentMethod: 'GIFT_CERTIFICATE',
        paymentTransaction: {
            amount: {
                value: 0
            }
        }
    }
]);

describe('Payment', function () {
    var PaymentModel = null;
    var helper = proxyquire('../../../../app_storefront_base/cartridge/scripts/dwHelpers', {
        'dw/util/ArrayList': ArrayList
    });
    PaymentModel = proxyquire('../../../../app_storefront_base/cartridge/models/payment', {
        '~/cartridge/scripts/dwHelpers': helper
    });

    it('should take payment Methods and convert to a plain object ', function () {
        var result = new PaymentModel(paymentMethods, null, null);
        assert.equal(
            result.applicablePaymentMethods.length, 2
        );
        assert.equal(result.applicablePaymentMethods[0].ID, 'GIFT_CERTIFICATE');
        assert.equal(result.applicablePaymentMethods[0].name, 'Gift Certificate');
        assert.equal(result.applicablePaymentMethods[1].ID, 'CREDIT_CARD');
        assert.equal(result.applicablePaymentMethods[1].name, 'Credit Card');
    });

    it('should take payment cards and convert to a plain object ', function () {
        var result = new PaymentModel(null, paymentCards, null);
        assert.equal(
            result.applicablePaymentCards.length, 4
        );
        assert.equal(result.applicablePaymentCards[0].cardType, 'Visa');
        assert.equal(result.applicablePaymentCards[0].name, 'Visa');
        assert.equal(result.applicablePaymentCards[1].cardType, 'Amex');
        assert.equal(result.applicablePaymentCards[1].name, 'American Express');
    });

    it('should take payment instruments and convert to a plain object ', function () {
        var result = new PaymentModel(null, null, paymentInstruments);
        assert.equal(
            result.selectedPaymentInstruments.length, 2
        );
        assert.equal(result.selectedPaymentInstruments[0].lastFour, '1111');
        assert.equal(result.selectedPaymentInstruments[0].owner, 'The Muffin Man');
        assert.equal(result.selectedPaymentInstruments[0].expirationYear, 2018);
        assert.equal(result.selectedPaymentInstruments[0].type, 'Visa');
        assert.equal(
            result.selectedPaymentInstruments[0].maskedCreditCardNumber,
            '************1111'
        );
        assert.equal(result.selectedPaymentInstruments[0].paymentMethod, 'CREDIT_CARD');
        assert.equal(result.selectedPaymentInstruments[0].expirationMonth, 1);
        assert.equal(result.selectedPaymentInstruments[0].amount, 0);

        assert.equal(result.selectedPaymentInstruments[1].giftCertificateCode, 'someString');
        assert.equal(
            result.selectedPaymentInstruments[1].maskedGiftCertificateCode,
            'some masked string'
        );
        assert.equal(result.selectedPaymentInstruments[1].paymentMethod, 'GIFT_CERTIFICATE');
        assert.equal(result.selectedPaymentInstruments[1].amount, 0);
    });
});