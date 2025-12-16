require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('./backend/models/customer.model');

const mongoURI = process.env.MONGODB_URI || process.env.ATLAS_URI || 'mongodb://localhost:27017/barberapp';

mongoose.connect(mongoURI)
    .then(async () => {
        console.log('Connected');
        await Customer.deleteOne({ phone_number: '5541483634' });
        console.log('Deleted 5541483634');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
