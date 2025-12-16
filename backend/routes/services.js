const router = require('express').Router();
let Service = require('../models/service.model');

router.route('/').get((req, res) => {
  Service.find()
    .then(services => res.json(services))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/add').post((req, res) => {
  const { name, duration_minutes, price } = req.body;

  const newService = new Service({
    name,
    duration_minutes,
    price,
  });

  newService.save()
    .then(() => res.json('Service added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/:id').get((req, res) => {
  Service.findById(req.params.id)
    .then(service => res.json(service))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/:id').delete((req, res) => {
  Service.findByIdAndDelete(req.params.id)
    .then(() => res.json('Service deleted.'))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/update/:id').post((req, res) => {
  Service.findById(req.params.id)
    .then(service => {
      service.name = req.body.name;
      service.duration_minutes = req.body.duration_minutes;
      service.price = req.body.price;

      service.save()
        .then(() => res.json('Service updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
