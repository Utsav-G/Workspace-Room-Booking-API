module.exports = (sequelize, DataTypes) => {
  const Team = sequelize.define('team', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },{
    timestamps: false
  });

  Team.associate = models => {
    Team.hasMany(models.User, {
      foreignKey: 'teamId',
      as: 'members'
    });
    Team.hasMany(models.Booking, {
      foreignKey: 'teamId',
      as: 'bookings'
    });
  };

  return Team;
};
