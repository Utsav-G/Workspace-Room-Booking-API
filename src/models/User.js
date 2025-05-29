module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    gender: {
      type: DataTypes.STRING,
      validate: {
        isIn: [['Male', 'Female', 'Other']]
      }
    }
  },{
    timestamps: false
  });

  User.associate = models => {
    User.belongsTo(models.Team, {
      foreignKey: 'teamId',
      as: 'team'
    });

    User.hasMany(models.Booking, {
      foreignKey: 'userId',
      as: 'bookings'
    });
  };

  return User;
};
