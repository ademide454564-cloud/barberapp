const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.ATLAS_URI;
mongoose.connect(uri);
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})

const servicesRouter = require('./routes/services');
const customersRouter = require('./routes/customers');
const appointmentsRouter = require('./routes/appointments');
const staffRouter = require('./routes/staff');
const verificationRouter = require('./routes/verification');
const photosRouter = require('./routes/photos');
const reviewsRouter = require('./routes/reviews');
const blockedTimesRouter = require('./routes/blockedTimes');
const serviceExtrasRouter = require('./routes/serviceExtras');

app.use('/services', servicesRouter);
app.use('/customers', customersRouter);
app.use('/appointments', appointmentsRouter);
app.use('/staff', staffRouter);
app.use('/verification', verificationRouter);
app.use('/photos', photosRouter);
app.use('/reviews', reviewsRouter);
app.use('/blocked-times', blockedTimesRouter);
app.use('/service-extras', serviceExtrasRouter);

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port: ${port}`);
    console.log(`Server is accessible at http://localhost:${port}`);
    console.log(`For Android Emulator use: http://10.0.2.2:${port}`);
});
