# Appointment Booking System

A basic time-slot based appointment booking system built with **Express.js**, **MongoDB**, and **EJS**. Users can register, log in, create services, and book appointments on other users' services.

> ⚠️ Admin pages and payment integrations are under development.

---

## 🔧 Prerequisites

* Node.js v14 or later
* MongoDB installed locally or cloud-hosted (like MongoDB Atlas)

---

## 🚀 Getting Started

```bash
git clone https://github.com/MIbrahimPro/Appointment-Booking-System.git
cd Appointment-Booking-System
npm install
```

1. Create a `.env` file or rename `.env.sample`.
2. Add the following environment variables:

```env
SESSION_SECRET=your_secret_key_here
JWT_SECRET=your_jwt_secret_here
MONGO_URI=mongodb://localhost:27017/Scheduly
PORT=5000
BASEURL=http://localhost:5000/api
```

3. Initialize the database (⚠️ this will delete all existing data so only run once in begining):

```bash
node scripts/script
```

This will populate the system with some demo users:

```
┌─────────┬──────────────────────┬────────────────┐
│ (index) │ email                │ password       │
├─────────┼──────────────────────┼────────────────┤
│ 0       │ 'alice@example.com'  │ 'Password1!'   │
│ 1       │ 'bob@example.com'    │ 'Secure*Pass2' │
│ 2       │ 'carlos@example.com' │ 'Demo#1234'    │
│ 3       │ 'diana@example.com'  │ 'Test123$'     │
│ 4       │ 'eve@example.com'    │ 'User@2025'    │
└─────────┴──────────────────────┴────────────────┘
```

4. Start the development server (run this command only everytime you need to restart the server again ):

```bash
node server.js
```

---

## 📬 Support

Have questions or suggestions?

* **Email**: [mibrahimpro.1@gmail.com](mailto:mibrahimpro.1@gmail.com)
* **Phone**: +92 319 7877750
