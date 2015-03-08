var firebase = require('firebase');
var rx = require('rx');
var request = require('request');
var moment = require('moment');

var users = {
  personal: {
    uid: 1110568334,
    token: '95A52CF7234E1FDE4A4EB94202D90DB1',
    'api-token': 'HackathonApiToken'
  },
  comfortable: {
    uid: 1110570164,
    token: '119947F2D985C3788998543A3D3AD90C',
    'api-token': 'HackathonApiToken'
  },
  struggling: {
    uid: 1110570166,
    token: '63C08C4AA6E3CB1A4B13C9C5299365C0',
    'api-token': 'HackathonApiToken'
  },
};

// Base URL for the aPI
var baseURL = "https://api.levelmoney.com/api/v2/hackathon/";

// Setup the observable request
var rxRequest = rx.Observable.fromNodeCallback(request.post);

// Make post request
var makeRequest = exports.makeRequest = function(url, params) {
  params = params || {};
  params.args = params.args || users.struggling;
  options = { url: url, json: true, body: params };
  return rxRequest(options);
};

// Load all transactions
var getTransactions = exports.getTransactions = function() {
  return makeRequest(baseURL + 'get-all-transactions');
};

var getMonthTransactions = exports.getMonthTransactions = function() {
  return getTransactions()
    .pluck(1)
    .pluck('transactions')
    .flatMap(function(transaction) {
      return transaction;
    })
    .filter(function(transaction) {
      transactionTime = moment(transaction["transaction-time"]);
      return moment().diff(transactionTime, 'months') < 1;
    })
    .map(function(transaction) {
      var date = moment(transaction["transaction-time"]);
      return {
        date: date.format('ddd, MMM, Do YYYY'),
        time: date.format('h:mm a'),
        datetime: date.format('x'),
        merchant: transaction.merchant,
        amount: (transaction.amount / 10000).toFixed(2),
        pending: transaction["is-pending"]
      };
    });
};

// Load the projected transactions for a year or month
var getProjectedTransactions = exports.getProjectedTransactions = function(year, month) {
  return makeRequest(baseURL + 'projected-transactions-for-month', { year: year, month: month });
};

// Load current month and previous balances
var getBalances = exports.getBalances = function() {
  return makeRequest(baseURL + 'balances');
};

// Find similar transactions
var findSimilarTransactions = exports.findSimilarTransactions = function(transactions) {
  return makeRequest(baseURL + 'find-similar-transactions', { 'transaction-ids': transactions });
};

var getCurrentDiff = exports.getCurrentDiff = function() {
  return getMonthTransactions()
    .reduce(function(acc, transaction) {
      return acc + parseFloat(transaction.amount);
    }, 0);
};