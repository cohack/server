var compute = require('./compute');
var _ = require('lodash');
var rx = require('rx');
var Firebase = require('firebase');
var moment = require('moment');

// API
// gets - Amounts
// puts - Amounts progress data
// gets - Net worh
// puts - Computed daily savings schedule, Computed monthly savings
// gets - Transactions, Predicted transactions
// puts - Diffed transations with right status

// Send daily messages
// Send messages when you are under budget

// Schedule a job for pulling data from the api
// Keep the information in firebase that got from the api
// Have a separate table for that
// Listen to the data from client firebase and pull info and update
// Push updated data back

var computeChanges = function() {

  var transactionsRef = new Firebase("https://cohack.firebaseio.com/transactions");
  var currentRef = new Firebase("https://cohack.firebaseio.com/current");
  var goalsRef = new Firebase("https://cohack.firebaseio.com/goals");

  compute.getMonthTransactions()
    .reduce(function(acc, transaction) {
      index = _.findIndex(acc, function(prev) {
        return transaction.datetime > prev.datetime;
      });

      if (index === -1) {
        acc.push(transaction);
      } else {
        acc.splice(index, 0, transaction);
      }

      return acc;
    }, [])
    .subscribe(function(transactions) {
      transactionsRef.set(transactions);
    });

  goalsRef.on('value', function(dataSnapshot) {
    var obj = dataSnapshot.val();
    var savingGoal = _.chain(obj)
      .values()
      .map(function(saving) {
        console.log(saving);
        return parseFloat(saving.amount) / parseInt(saving.months);
      })
      .reduce(function(acc, saving) {
        return acc + saving;
      }, 0)
      .value();

      compute.getCurrentDiff().subscribe(function(diff) {
        progress = diff - savingGoal;
        currentRef.child('diff').set(diff.toFixed(2));
        currentRef.child('progress').set(progress.toFixed(2));
      });
  });
};

computeChanges();