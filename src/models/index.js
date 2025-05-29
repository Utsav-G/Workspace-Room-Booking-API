const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); 

// import models
const Room = require('./Room')(sequelize, DataTypes);
const User = require('./User')(sequelize, DataTypes);
const Team = require('./Team')(sequelize, DataTypes);
const Booking = require('./Booking')(sequelize, DataTypes);

// define associations
Team.hasMany(User, { foreignKey: 'teamId', as: 'members' });
User.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

if (Booking.associate) {
  Booking.associate({ Room, User, Team });
}

if (Room.associate) {
  Room.associate({ Booking });
}

// xport models 
module.exports = {
  sequelize,
  Room,
  User,
  Team,
  Booking
};
