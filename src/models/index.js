const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); 

// Import models
const Room = require('./Room')(sequelize, DataTypes);
const User = require('./User')(sequelize, DataTypes);
const Team = require('./Team')(sequelize, DataTypes);
const Booking = require('./Booking')(sequelize, DataTypes);

// Define associations
Team.hasMany(User, { foreignKey: 'teamId', as: 'members' });
User.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

if (Booking.associate) {
  Booking.associate({ Room, User, Team });
}

if (Room.associate) {
  Room.associate({ Booking });
}

// Export models and sequelize instance
module.exports = {
  sequelize,
  Room,
  User,
  Team,
  Booking
};
