const router = require('express').Router();
let Staff = require('../models/staff.model');
let Customer = require('../models/customer.model');

// Çalışan renk paleti - Güzel ve ayırt edilebilir renkler
const STAFF_COLORS = [
  '#3B82F6', // Mavi
  '#EC4899', // Pembe
  '#10B981', // Yeşil
  '#F59E0B', // Turuncu
  '#8B5CF6', // Mor
  '#EF4444', // Kırmızı
  '#06B6D4', // Cyan
  '#F97316', // Koyu Turuncu
  '#14B8A6', // Teal
  '#6366F1', // Indigo
];

// Kullanılmamış bir renk seç
const getNextAvailableColor = async () => {
  const existingStaff = await Staff.find({ is_active: true });
  const usedColors = existingStaff.map(s => s.color);

  // Kullanılmamış renk bul
  for (let color of STAFF_COLORS) {
    if (!usedColors.includes(color)) {
      return color;
    }
  }

  // Tüm renkler kullanılmışsa, rastgele bir renk döndür
  return STAFF_COLORS[Math.floor(Math.random() * STAFF_COLORS.length)];
};

// TEST: Post route çalışıyor mu kontrol et
router.post('/test-post', (req, res) => {
  console.log('Test post route hit!');
  res.json({ message: "Post route is working!" });
});

// Tüm aktif staff'ı getir
router.route('/').get((req, res) => {
  Staff.find({ is_active: true })
    .then(staff => res.json(staff))
    .catch(err => res.status(400).json('Error: ' + err));
});

// Tüm staff'ı getir (aktif + pasif)
router.route('/all').get((req, res) => {
  Staff.find()
    .then(staff => res.json(staff))
    .catch(err => res.status(400).json('Error: ' + err));
});

// Yeni staff ekle
router.route('/add').post(async (req, res) => {
  try {
    const { name, phone_number, email, specialties, profile_image } = req.body;
    console.log(`Adding staff: ${name}, phone: ${phone_number}`);

    let customer = await Customer.findOne({ phone_number: phone_number.trim() });

    if (!customer) {
      console.log(`Creating new customer for staff: ${name}`);
      customer = new Customer({
        name,
        phone_number: phone_number.trim(),
        email: email || '',
        password: '12345',
        is_admin: true,
      });
      await customer.save();
      console.log(`Customer created with is_admin: ${customer.is_admin}`);
    } else if (!customer.is_admin) {
      console.log(`Customer exists, making admin: ${customer.name}`);
      customer.is_admin = true;
      await customer.save();
      console.log(`Customer updated to admin`);
    } else {
      console.log(`Customer already exists and is admin: ${customer.name}`);
    }

    // Otomatik renk ata
    const staffColor = await getNextAvailableColor();
    console.log(`Assigning color ${staffColor} to ${name}`);

    const newStaff = new Staff({
      name,
      phone_number: phone_number.trim(),
      email,
      specialties,
      profile_image,
      color: staffColor,
    });

    await newStaff.save();
    console.log(`Staff created successfully: ${newStaff._id} with color ${newStaff.color}`);

    res.json({
      message: 'Staff added successfully!',
      staff: newStaff,
      customer: customer
    });
  } catch (err) {
    console.error('Staff add error:', err);
    res.status(400).json({ error: 'Error: ' + err.message });
  }
});

// ÖNEMLİ: Özel route'lar genel /:id route'undan ÖNCE gelmeli!

// Staff'ı pasif yap (deactivate)
router.route('/deactivate/:id').post(async (req, res) => {
  console.log(`=== DEACTIVATE ROUTE HIT! ID: ${req.params.id} ===`);
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      console.error('Staff not found:', req.params.id);
      return res.status(404).json({ error: 'Staff not found' });
    }

    staff.is_active = false;
    await staff.save();
    console.log(`Staff ${staff.name} deactivated`);

    if (staff.phone_number) {
      const customer = await Customer.findOne({ phone_number: staff.phone_number });
      if (customer) {
        console.log(`Found customer ${customer.name}, is_admin: ${customer.is_admin}`);
        if (customer.is_admin) {
          customer.is_admin = false;
          await customer.save();
          console.log(`Customer ${customer.name} admin rights removed`);
        }
      } else {
        console.log(`No customer found with phone: ${staff.phone_number}`);
      }
    }

    res.json({
      message: 'Staff deactivated successfully!',
      staff: staff
    });
  } catch (err) {
    console.error('Deactivate error:', err);
    res.status(400).json({ error: 'Error: ' + err.message });
  }
});

// Staff'ı aktif yap (activate)
router.route('/activate/:id').post(async (req, res) => {
  console.log(`=== ACTIVATE ROUTE HIT! ID: ${req.params.id} ===`);
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      console.error('Staff not found:', req.params.id);
      return res.status(404).json({ error: 'Staff not found' });
    }

    staff.is_active = true;
    await staff.save();
    console.log(`Staff ${staff.name} activated`);

    if (staff.phone_number) {
      const customer = await Customer.findOne({ phone_number: staff.phone_number });
      if (customer) {
        console.log(`Found customer ${customer.name}, is_admin: ${customer.is_admin}`);
        if (!customer.is_admin) {
          customer.is_admin = true;
          await customer.save();
          console.log(`Customer ${customer.name} admin rights granted`);
        }
      } else {
        console.log(`No customer found with phone: ${staff.phone_number}`);
      }
    }

    res.json({
      message: 'Staff activated successfully!',
      staff: staff
    });
  } catch (err) {
    console.error('Activate error:', err);
    res.status(400).json({ error: 'Error: ' + err.message });
  }
});

// Staff güncelle
router.route('/update/:id').post((req, res) => {
  Staff.findById(req.params.id)
    .then(staff => {
      staff.name = req.body.name;
      staff.phone_number = req.body.phone_number;
      staff.email = req.body.email;
      staff.specialties = req.body.specialties;
      staff.profile_image = req.body.profile_image;
      staff.is_active = req.body.is_active !== undefined ? req.body.is_active : staff.is_active;
      if (req.body.color) staff.color = req.body.color;

      staff.save()
        .then(() => res.json('Staff updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// Tüm çalışanlara otomatik renk ata
router.route('/assign-colors').post(async (req, res) => {
  try {
    const allStaff = await Staff.find();
    let colorIndex = 0;

    for (let staff of allStaff) {
      if (!staff.color || staff.color === '#3B82F6') {
        staff.color = STAFF_COLORS[colorIndex % STAFF_COLORS.length];
        await staff.save();
        console.log(`Assigned color ${staff.color} to ${staff.name}`);
        colorIndex++;
      }
    }

    res.json({
      message: 'Colors assigned successfully!',
      updatedCount: colorIndex
    });
  } catch (err) {
    console.error('Assign colors error:', err);
    res.status(400).json({ error: 'Error: ' + err.message });
  }
});

// Servis ve tarih için uygun staff'ları getir
router.route('/available/:serviceId/:date').get(async (req, res) => {
  try {
    const allStaff = await Staff.find({ is_active: true });
    res.json(allStaff);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

// GENEL ROUTE'LAR EN SONDA OLMALI

// Staff detayını getir (ID ile)
router.route('/:id').get((req, res) => {
  Staff.findById(req.params.id)
    .then(staff => res.json(staff))
    .catch(err => res.status(400).json('Error: ' + err));
});

// Staff sil
router.route('/:id').delete((req, res) => {
  Staff.findByIdAndDelete(req.params.id)
    .then(() => res.json('Staff deleted.'))
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
