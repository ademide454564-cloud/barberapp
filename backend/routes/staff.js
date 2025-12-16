const router = require('express').Router();
let Staff = require('../models/staff.model');

router.route('/').get((req, res) => {
  Staff.find({ is_active: true })
    .then(staff => res.json(staff))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/all').get((req, res) => {
  Staff.find()
    .then(staff => res.json(staff))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/add').post((req, res) => {
  const { name, phone_number, email, specialties, profile_image } = req.body;

  const newStaff = new Staff({
    name,
    phone_number,
    email,
    specialties,
    profile_image,
  });

  newStaff.save()
    .then(() => res.json('Staff added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/:id').get((req, res) => {
  Staff.findById(req.params.id)
    .then(staff => res.json(staff))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/:id').delete((req, res) => {
  Staff.findByIdAndDelete(req.params.id)
    .then(() => res.json('Staff deleted.'))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/update/:id').post((req, res) => {
  Staff.findById(req.params.id)
    .then(staff => {
      staff.name = req.body.name;
      staff.phone_number = req.body.phone_number;
      staff.email = req.body.email;
      staff.specialties = req.body.specialties;
      staff.profile_image = req.body.profile_image;
      staff.is_active = req.body.is_active !== undefined ? req.body.is_active : staff.is_active;

      staff.save()
        .then(() => res.json('Staff updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/available/:serviceId/:date').get(async (req, res) => {
  try {
    const allStaff = await Staff.find({ is_active: true });
    res.json(allStaff);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

module.exports = router;
