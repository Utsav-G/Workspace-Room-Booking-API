const { sequelize, Room, User, Team } = require('./models');

async function seed() {
  await sequelize.sync({ force: true }); // WARNING: This will reset all tables

  // Seed Rooms
  await Room.bulkCreate([
    ...Array(8).fill().map(() => ({ roomType: 'private', capacity: 1 })),
    ...Array(4).fill().map(() => ({ roomType: 'conference', capacity: 6 })),
    ...Array(3).fill().map(() => ({ roomType: 'shared', capacity: 4 }))
  ]);

  // Seed Users
  const userData = [
    { name: 'User1', age: 25, gender: 'male' },
    { name: 'User2', age: 30, gender: 'female' },
    { name: 'User3', age: 28, gender: 'male' },
    { name: 'User4', age: 26, gender: 'female' },
    { name: 'User5', age: 27, gender: 'male' },
    { name: 'User6', age: 8, gender: 'female' },    // child
    { name: 'User7', age: 32, gender: 'male' },
    { name: 'User8', age: 29, gender: 'female' },
    { name: 'User9', age: 31, gender: 'male' },
    { name: 'User10', age: 33, gender: 'female' },
    { name: 'User11', age: 35, gender: 'male' },
    { name: 'User12', age: 7, gender: 'male' },     // child
    { name: 'User13', age: 24, gender: 'female' },
    { name: 'User14', age: 22, gender: 'male' },
    { name: 'User15', age: 36, gender: 'female' },
    { name: 'User16', age: 9, gender: 'male' },     // child
    { name: 'User17', age: 21, gender: 'female' },
    { name: 'User18', age: 40, gender: 'male' },
    { name: 'User19', age: 27, gender: 'female' },
    { name: 'User20', age: 6, gender: 'female' }     // child
  ];

  const users = await User.bulkCreate(userData);

  // 3. Create Teams
  const team1 = await Team.create({ name: 'Team Alpha' });
  const team2 = await Team.create({ name: 'Team Beta' });
  const team3 = await Team.create({ name: 'Team Gamma' });

  // 4. Assign teamId to users
  await Promise.all([
    // Team Alpha: 4 members (1 child)
    users[0].update({ teamId: team1.id }),
    users[1].update({ teamId: team1.id }),
    users[2].update({ teamId: team1.id }),
    users[5].update({ teamId: team1.id }),

    // Team Beta: 5 members (1 child)
    users[6].update({ teamId: team2.id }),
    users[7].update({ teamId: team2.id }),
    users[8].update({ teamId: team2.id }),
    users[10].update({ teamId: team2.id }),
    users[11].update({ teamId: team2.id }),

    // Team Gamma: 6 members (1 child)
    users[12].update({ teamId: team3.id }),
    users[13].update({ teamId: team3.id }),
    users[14].update({ teamId: team3.id }),
    users[15].update({ teamId: team3.id }),
    users[16].update({ teamId: team3.id }),
    users[17].update({ teamId: team3.id })
  ]);

  console.log('✅ Seeding complete!');
  process.exit();
}

seed();
