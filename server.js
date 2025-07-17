//libraaries import
require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const connectDB = require('./config/db');

//middlewares
const requestLogger = require("./middleware/logger");
const finalizePastAppointments = require('./jobs/finalizeAppointments');
const cleaner = require('./jobs/cleanUp');

//json routes
const apiUserRoutes = require('./routes/api/user');
const servicesApi = require('./routes/api/services');
const apptApi = require('./routes/api/appointments');
const categoriesApi = require('./routes/api/categories');
const favApi = require('./routes/api/favorites');

//client routes
const clientUserRoutes = require('./routes/client/user');
const servicesClient = require('./routes/client/services');
const clientAppts = require('./routes/client/appointments');
const reviewsClient = require('./routes/client/reviews');
const profileClient = require('./routes/client/publicProfile');
const manageServices = require('./routes/client/manage-services');



const app = express();

app.use(requestLogger);
app.use(cleaner);
// app.use(morgan('dev'));

// Connect to MongoDB
connectDB();

setInterval(() => {
    // console.log("finalizer run")
    finalizePastAppointments().catch(err => console.error('Finalize job error:', err));
}, 6 * 1000); // every 60 seconds


// EJS + Layout setup
app.use(expressLayouts);
app.set('layout', 'layout');    // views/layouts/main.ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



// Static folders
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));




// api routes
app.use('/api/user', apiUserRoutes);
app.use('/api/services', servicesApi);
app.use('/api/categories', categoriesApi);
app.use('/api/appointments', apptApi);
app.use('/api/favorites', favApi);


//client routes
app.use('/client/user', clientUserRoutes);
app.use('/client/services/manage', manageServices);
app.use('/client/services', servicesClient);
app.use('/client/reviews', reviewsClient);
app.use('/client/appointments', clientAppts);
app.use('/client/publicProfile', profileClient);



// Redirect all other remaining to go to this login page
app.get('/client', (req, res) => res.redirect('/client/user/login'));
app.get('/', (req, res) => res.redirect('/client/user/login'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
