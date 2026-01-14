const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const { startReviewReminderCron } = require('./utils/reviewReminderCron');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.ATLAS_URI;
mongoose.connect(uri);
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");

  // Değerlendirme hatırlatması cron job'unu başlat
  startReviewReminderCron();
})

const authRouter = require('./routes/auth');
const servicesRouter = require('./routes/services');
const customersRouter = require('./routes/customers');
const appointmentsRouter = require('./routes/appointments');
const staffRouter = require('./routes/staff');
const verificationRouter = require('./routes/verification');
const photosRouter = require('./routes/photos');
const reviewsRouter = require('./routes/reviews');
const blockedTimesRouter = require('./routes/blockedTimes');
const serviceExtrasRouter = require('./routes/serviceExtras');
const notificationsRouter = require('./routes/notifications');
const expensesRouter = require('./routes/expenses');
const settingsRouter = require('./routes/settings');
const productsRouter = require('./routes/products');
const productSalesRouter = require('./routes/productSales');

app.use('/auth', authRouter);
app.use('/services', servicesRouter);
app.use('/customers', customersRouter);
app.use('/appointments', appointmentsRouter);
app.use('/staff', staffRouter);
app.use('/verification', verificationRouter);
app.use('/photos', photosRouter);
app.use('/reviews', reviewsRouter);
app.use('/blocked-times', blockedTimesRouter);
app.use('/service-extras', serviceExtrasRouter);
app.use('/notifications', notificationsRouter);
app.use('/expenses', expensesRouter);
app.use('/settings', settingsRouter);
app.use('/products', productsRouter);
app.use('/product-sales', productSalesRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    message: 'Barber App Backend is running!'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Barber App Backend API',
    version: '1.0.0',
    endpoints: [
      '/health',
      '/services',
      '/customers',
      '/appointments',
      '/staff',
      '/verification',
      '/photos',
      '/reviews',
      '/blocked-times',
      '/service-extras',
      '/expenses',
      '/settings',
      '/products',
      '/product-sales'
    ]
  });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port: ${port}`);
    console.log(`Server is accessible at http://localhost:${port}`);
    console.log(`For Android Emulator use: http://10.0.2.2:${port}`);
});
