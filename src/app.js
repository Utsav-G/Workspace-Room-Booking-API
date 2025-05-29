require('dotenv').config({
  path: process.env.NODE_ENV === "docker" ? ".env.docker" : ".env",
});
const express = require('express');
const {sequelize} = require('./models/index')
const bookingRoutes = require('./routes/bookingRoutes')

const app = express();
app.use(express.json())
app.use('/api/v1', bookingRoutes)

// Test database connection
sequelize.authenticate()
  .then(() => console.log('✅Connected to PostgreSQL'))
  .catch(err => console.error('Connection failed:', err));

// Sync models (create tables)
sequelize.sync({ alter:true })
  .then(() => console.log('✅Database synced'))
  .catch(err => console.error('Sync error:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('✅Workspace Booking API');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅Server running on http://localhost:${PORT}`);
});