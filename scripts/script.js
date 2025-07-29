const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Models
const Category = require('../models/Category');
const User = require('../models/User');
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');
const Rating = require('../models/Rating');

// Utility functions for random data without faker
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysPast, daysFuture) {
  const now = new Date();
  const past = new Date(now);
  past.setDate(now.getDate() - daysPast);
  const future = new Date(now);
  future.setDate(now.getDate() + daysFuture);
  return new Date(past.getTime() + Math.random() * (future.getTime() - past.getTime()));
}

// Sample data arrays
const serviceNames = ['Relax Therapy', 'Quick Cut', 'Healing Hands', 'Zen Session', 'Clip & Style', 'Health Check', 'Mindful Moment', 'Buzz Cut'];
const descriptions = ['High-quality service.', 'Experienced professional.', 'Customer-focused approach.', 'Affordable and reliable.', 'Tailored to your needs.'];
const cities = ['Lahore', 'Karachi', 'Islamabad', 'Peshawar', 'Quetta', 'Rawalpindi', 'Multan', 'Faisalabad'];
const statuses = ['pending', 'confirmed', 'cancelled', 'completed'];
const comments = ['Excellent service!', 'Very satisfied.', 'Will book again.', 'Could be better.', 'Not as expected.'];

// Connect to MongoDB
theUri = process.env.MONGO_URI || 'mongodb://localhost:27017/Scheduly';
mongoose.connect(theUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

async function seed() {
  try {
    // Clear existing data
    await Rating.deleteMany({});
    await Appointment.deleteMany({});
    await Service.deleteMany({});
    await User.deleteMany({});
    await Category.deleteMany({});
    console.log('Cleared collections');

    // Create categories
    const categoriesData = [
      { name: 'meditation', icon: '/uploads/icons/brain-solid.svg', color: 'hsl(200, 50%, 70%)' },
      { name: 'medcure', icon: '/uploads/icons/hand-holding-heart-solid.svg', color: 'hsl(120, 30%, 80%)' },
      { name: 'barber', icon: '/uploads/icons/scissors-solid.svg', color: 'hsl(0, 60%, 75%)' },
    ];
    const categories = await Category.insertMany(categoriesData);
    console.log('Seeded categories');

    // Create predefined users with known passwords
    const rawUsers = [
      { name: 'Alice Example', email: 'alice@example.com', password: 'Password1!', phone: '+92-300-0000001', location: 'Lahore', image: '/uploads/users/m (1).jpg' },
      { name: 'Bob Sample', email: 'bob@example.com', password: 'Secure*Pass2', phone: '+92-300-0000002', location: 'Karachi', image: '/uploads/users/m (2).jpg' },
      { name: 'Carlos Demo', email: 'carlos@example.com', password: 'Demo#1234', phone: '+92-300-0000003', location: 'Islamabad', image: '/uploads/users/m (3).jpg' },
      { name: 'Diana Test', email: 'diana@example.com', password: 'Test123$', phone: '+92-300-0000004', location: 'Peshawar', image: '/uploads/users/m (4).jpg' },
      { name: 'Eve User', email: 'eve@example.com', password: 'User@2025', phone: '+92-300-0000005', location: 'Quetta', image: '/uploads/users/m (5).jpg' }
    ];

    // Hash passwords and insert
    const usersToInsert = [];
    const credentials = [];
    for (const u of rawUsers) {
      const hash = await bcrypt.hash(u.password, 10);
      usersToInsert.push({
        name: u.name,
        email: u.email,
        password: hash,
        phone: u.phone,
        location: u.location,
        image: u.image
      });
      credentials.push({ email: u.email, password: u.password });
    }
    const users = await User.insertMany(usersToInsert);
    console.log('Seeded users');

    // Output credentials for README
    console.log('Created user accounts:');
    console.table(credentials);

    // Create services
    const services = [];
    for (let i = 0; i < 50; i++) {
      const user = randomChoice(users);
      const category = randomChoice(categories);
      services.push({
        user_id: user._id,
        name: randomChoice(serviceNames),
        description: randomChoice(descriptions),
        category_id: category._id,
        price: randomInt(10, 100),
        duration: randomChoice([30, 45, 60, 90]),
        location: randomChoice(cities),
        experience: randomInt(0, 10),
        working_hours: [
          { day: 'Monday', start_time: '09:00', end_time: '17:00' },
          { day: 'Tuesday', start_time: '09:00', end_time: '17:00' },
        ],
      });
    }
    const insertedServices = await Service.insertMany(services);
    console.log('Seeded services');

    // Create appointments
    const appointments = [];
    for (let i = 0; i < 200; i++) {
      const user = randomChoice(users);
      const service = randomChoice(insertedServices);
      const date = randomDate(30, 30);
      const time = `${randomInt(8, 18)}:00`;
      const status = randomChoice(statuses);
      appointments.push({ user_id: user._id, service_id: service._id, date, time, status });
    }
    const insertedAppointments = await Appointment.insertMany(appointments);
    console.log('Seeded appointments');

    // Create unique ratings for completed appointments
    const ratings = [];
    const seen = new Set();
    insertedAppointments
      .filter(a => a.status === 'completed')
      .forEach(a => {
        const key = `${a.user_id}_${a.service_id}`;
        if (!seen.has(key)) {
          seen.add(key);
          ratings.push({
            user_id: a.user_id,
            service_id: a.service_id,
            rating: randomInt(1, 5),
            comment: randomChoice(comments)
          });
        }
      });
    await Rating.insertMany(ratings);
    console.log('Seeded ratings/reviews');

    console.log('Seeding completed');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
