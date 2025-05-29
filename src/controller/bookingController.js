const { Op } = require("sequelize");
const { Booking, Room, User, Team, sequelize } = require("../models");
const {
  getTodayRange,
  transformBookingArrayObjects,
} = require("./helperfunctions");

module.exports = {
  //POST room booking API
  bookRoom: async (req, res) => {
    let transaction;
    let committed = false;
    try {
      transaction = await sequelize.transaction();
      const { slot, roomType, bookerId, bookerType } = req.body;

      if (!slot || !bookerId || !bookerType) {
        //roomType can be null, only defined in case of conference request
        return res
          .status(400)
          .json({ message: "Missing required booking information." });
      }

      if (slot < 9 || slot > 17) {
        return res
          .status(400)
          .json({ message: "Slot must be between 9 and 17 (inclusive)." });
      }

      const [startOfDay, endOfDay] = getTodayRange();
      let bookingEntity = null;
      let members = [];
      let seatCapacity = 1;
      let headCount = 1;

      // Get the booking entity object from db (user or team)
      //and checking headcount for conference room
      if (bookerType === "user") {
        bookingEntity = await User.findByPk(bookerId);
        if (!bookingEntity)
          return res.status(404).json({ message: "User not found." });
      } else if (bookerType === "team") {
        bookingEntity = await Team.findByPk(bookerId, { include: ["members"] });
        if (!bookingEntity)
          return res.status(404).json({ message: "Team not found." });

        members = bookingEntity.members;
        headCount = members.length;
        seatCapacity = members.reduce((count, member) => {
          return count + (member.age >= 10 ? 1 : 0); // children do not take up space
        }, 0);

        if (roomType === "conference" && headCount < 3) {
          return res.status(400).json({
            message: "Conference room requires team size of 3 or more.",
          });
        }
        if (roomType === "conference" && seatCapacity > 6) {
          return res.status(400).json({
            message: "Conference room can hold at most 6 seats.",
          });
        }
      }

      //checking wether the same bookerId has booked for the slot
      const existingBooking = await Booking.findOne({
        where: {
          bookerId,
          bookerType,
          slot,
          createdAt: { [Op.between]: [startOfDay, endOfDay] },
        },
        transaction,
      });

      if (existingBooking) {
        return res
          .status(400)
          .json({ message: "Booker already has a booking at this slot." });
      }

      //checking if team of booking user has booked slot already
      if (bookerType === "user") {
        if (bookingEntity?.teamId) {
          const teamBooking = await Booking.findOne({
            where: {
              bookerId: bookingEntity.teamId,
              bookerType: "team",
              slot,
              createdAt: { [Op.between]: [startOfDay, endOfDay] },
            },
            transaction,
          });
          if (teamBooking) {
            return res
              .status(400)
              .json({ message: "User's team already booked this slot." });
          }
        }
      }

      //checking if team members of booking team has booked slot already
      if (bookerType === "team") {
        const memberIds = members.map((m) => m.id);
        const memberBooking = await Booking.findOne({
          where: {
            bookerType: "user",
            bookerId: {
              [Op.in]: memberIds,
            },
            slot,
            createdAt: { [Op.between]: [startOfDay, endOfDay] },
          },
          transaction,
        });

        if (memberBooking) {
          return res.status(400).json({
            message: "One or more team members already booked this slot.",
          });
        }
      }

      let allocatedRoom = null;

      if (bookerType === "user") {
        // Checking for available private rooms
        const privateRoomIds = await Room.findAll({
          where: { roomType: "private" },
          attributes: ["id"],
          raw: true,
        }).then((rooms) => rooms.map((r) => r.id));

        for (const roomId of privateRoomIds) {
          const room = await Room.findByPk(roomId, {
            lock: transaction.LOCK.UPDATE,
            transaction,
          });

          const overlapping = await Booking.findOne({
            where: {
              roomId,
              slot,
              createdAt: { [Op.between]: [startOfDay, endOfDay] },
            },
            transaction,
          });
          if (!overlapping) {
            allocatedRoom = room;
            break;
          }
        }

        // If no private room available --> checking for shared desk
        if (!allocatedRoom) {
          const sharedDesks = await Room.findAll({
            where: { roomType: "shared" },
            lock: transaction.LOCK.UPDATE,
            transaction,
          });

          for (const desk of sharedDesks) {
            const currentBookings = await Booking.count({
              where: {
                roomId: desk.id,
                slot,
                createdAt: { [Op.between]: [startOfDay, endOfDay] },
              },
              transaction,
            });

            if (currentBookings < desk.capacity) {
              allocatedRoom = desk;
              break;
            }
          }
        }
      } else if (bookerType === "team") {
        const conferenceRooms = await Room.findAll({
          where: { roomType: "conference" },
          lock: transaction.LOCK.UPDATE,
          transaction,
        });

        for (const room of conferenceRooms) {
          const overlapping = await Booking.findOne({
            where: {
              roomId: room.id,
              slot,
              createdAt: { [Op.between]: [startOfDay, endOfDay] },
            },
            transaction,
          });
          if (!overlapping) {
            allocatedRoom = room;
            break;
          }
        }
      }

      if (!allocatedRoom) {
        await transaction.rollback();
        return res.status(400).json({
          message: "No available room for the selected slot and type.",
        });
      }

      const newBooking = await Booking.create(
        {
          bookerId,
          bookerType,
          slot,
          roomId: allocatedRoom.id,
        },
        { transaction }
      );
      console.log();
      await transaction.commit();
      committed = true;

      res.status(201).json({
        message: "Room booked successfully.",
        bookingId: newBooking.bookingId,
        room: allocatedRoom,
      });
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      return res.status(500).json({ error: "Internal Server Error" });
    } finally {
      if (transaction && !committed) {
        await transaction.rollback();
        console.log("Transaction rolled back.");
      }
    }
  },

  //DELETE room cancelling
  cancelBooking: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const booking = await Booking.findByPk(bookingId);
      console.log(booking);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      await booking.destroy();
      return res.status(201).json({ message: "Booking cancelled" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to cancel booking" });
    }
  },

  //GET fetch all bookings
  getAllBookings: async (req, res) => {
    try {
      const bookings = await Booking.findAll({
        where: {
          createdAt: { [Op.between]: getTodayRange() },
        },
        include: [
          {
            model: Room,
            as: "room", // adjust alias if defined in association
          },
        ],
      });

      await Promise.all(
        bookings.map(async (booking) => {
          if (booking.bookerType === "user") {
            booking.user = await User.findByPk(booking.bookerId);
          } else if (booking.bookerType === "team") {
            booking.team = await Team.findByPk(booking.bookerId);
          }
        })
      );

      if (bookings.length == 0)
        return res.status(404).json({ error: "Booking not found" });
      return res.status(201).json(bookings.map(transformBookingArrayObjects));
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch bookings" });
    }
  },

  //GET fetch all available rooms
  getAvailableRooms: async (req, res) => {
    try {
      const slots = [9, 10, 11, 12, 13, 14, 15, 16, 17];
      const roomTypes = ["private", "conference", "shared"];
      const [startOfDay, endOfDay] = getTodayRange();
      const rooms = await Room.findAll();
      const bookings = await Booking.findAll({
        where: {
          createdAt: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },
      });

      const bookedRoomSlotMap = {};
      for (const b of bookings) {
        bookedRoomSlotMap[b.roomId] = bookedRoomSlotMap[b.roomId] || {};
        bookedRoomSlotMap[b.roomId][b.slot] =
          (bookedRoomSlotMap[b.roomId][b.slot] || 0) + 1;
      }

      const room_availability = {};
      for (const slot of slots) {
        const slotKey = `${slot}:00-${slot + 1}:00`;
        room_availability[slotKey] = {};
        for (const type of roomTypes) {
          const filteredRooms = rooms.filter((r) => r.roomType === type);
          const availableRooms = filteredRooms.filter((room) => {
            const bookedCount = bookedRoomSlotMap[room.id]?.[slot] || 0;
            if (type === "private" || type === "conference") {
              return bookedCount === 0;
            }
            if (type === "shared") {
              return bookedCount < room.capacity;
            }
            return false;
          });
          room_availability[slotKey][type] = availableRooms.map((r) => r.id);
        }
      }

      return res.status(201).json({ room_availability });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: "Failed to fetch room availability" });
    }
  },
};
