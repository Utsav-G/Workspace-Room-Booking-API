module.exports = (sequelize, DataTypes) => {
  const Room = sequelize.define('room', {
    roomType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['private', 'conference', 'shared']]
      }
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isPositive(value) {
          if (value <= 0) {
            throw new Error('Capacity must be positive');
          }
        },
        capacityMatchesRoomType(value) {
          switch (this.roomType) {
            case 'private':
              if (value !== 1) {
                throw new Error('Private rooms must have a capacity of 1');
              }
              break;
            case 'conference':
              if (value > 6) {
                throw new Error('Conference room capacity cannot exceed 6');
              }
              break;
            case 'shared':
              if (value !== 4) {
                throw new Error('Shared desks must have a capacity of 4');
              }
              break;
            default:
              throw new Error('Invalid room type');
          }
        }
      }
    }
  },{
    timestamps: false
  });

  Room.associate = models => {
    Room.hasMany(models.Booking, {
      foreignKey: 'roomId',
      as: 'bookings'
    });
  };

  return Room;
};