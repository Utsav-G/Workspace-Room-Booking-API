const { DataTypes, UUIDV4 } = require('sequelize');

module.exports = (sequelize) => {
  const Booking = sequelize.define('booking', {
    bookingId: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true
    },
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'rooms',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    slot: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 9,
        max: 17
      }
    },
    bookerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    bookerType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['user', 'team']]
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true
  });


  Booking.associate = (models) => {
    Booking.belongsTo(models.Room, {
      foreignKey: 'roomId',
      as: 'room'
    });
    
    Booking.belongsTo(models.User, {
      foreignKey: 'bookerId',
      constraints: false,
      as: 'user'
    });

    Booking.belongsTo(models.Team, {
      foreignKey: 'bookerId',
      constraints: false,
      as: 'team'
    });
  };

  return Booking;
};