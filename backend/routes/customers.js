const router = require('express').Router();
let Customer = require('../models/customer.model');

router.route('/').get((req, res) => {
  Customer.find()
    .then(customers => res.json(customers))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/add').post((req, res) => {
  const { name, phone_number, email } = req.body;

  const newCustomer = new Customer({
    name,
    phone_number,
    email,
  });

  newCustomer.save()
    .then(() => res.json('Customer added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/frequent-cancellers').get((req, res) => {
  Customer.find({ cancellation_count: { $gt: 0 } })
    .sort({ cancellation_count: -1 })
    .then(customers => res.json(customers))
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
