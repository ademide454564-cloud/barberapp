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

// Get customer by phone number
router.route('/phone/:phone').get((req, res) => {
  Customer.findOne({ phone_number: req.params.phone })
    .then(customer => {
      if (!customer) {
        return res.status(404).json('Customer not found');
      }
      res.json(customer);
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// Get single customer by ID
router.route('/:id').get((req, res) => {
  Customer.findById(req.params.id)
    .then(customer => {
      if (!customer) {
        return res.status(404).json('Customer not found');
      }
      res.json(customer);
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// Update customer
router.route('/:id').put((req, res) => {
  Customer.findById(req.params.id)
    .then(customer => {
      if (!customer) {
        return res.status(404).json('Customer not found');
      }

      customer.name = req.body.name || customer.name;
      customer.phone_number = req.body.phone_number || customer.phone_number;
      customer.email = req.body.email || customer.email;
      customer.birthdate = req.body.birthdate || customer.birthdate;
      customer.file_number = req.body.file_number || customer.file_number;

      customer.save()
        .then(() => res.json('Customer updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// Delete customer
router.route('/:id').delete((req, res) => {
  Customer.findByIdAndDelete(req.params.id)
    .then(customer => {
      if (!customer) {
        return res.status(404).json('Customer not found');
      }
      res.json('Customer deleted!');
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// Ban customer
router.route('/:id/ban').put((req, res) => {
  Customer.findById(req.params.id)
    .then(customer => {
      if (!customer) {
        return res.status(404).json('Customer not found');
      }

      customer.is_banned = true;
      customer.banned_reason = req.body.reason || 'No reason provided';

      customer.save()
        .then(() => res.json('Customer banned!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// Unban customer
router.route('/:id/unban').put((req, res) => {
  Customer.findById(req.params.id)
    .then(customer => {
      if (!customer) {
        return res.status(404).json('Customer not found');
      }

      customer.is_banned = false;
      customer.banned_reason = null;

      customer.save()
        .then(() => res.json('Customer unbanned!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// Update customer tags
router.route('/:id/tags').put((req, res) => {
  Customer.findById(req.params.id)
    .then(customer => {
      if (!customer) {
        return res.status(404).json('Customer not found');
      }

      customer.tags = req.body.tags || [];

      customer.save()
        .then(() => res.json(customer))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
