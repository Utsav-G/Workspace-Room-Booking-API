function transformBookingArrayObjects(booking) {
  const start = booking.slot;
  const end = start + 1;
  const slotFormatted = `${start}:00-${end}:00`;

  return {
    bookingId: booking.bookingId,
    bookedBy: booking.user ? booking.user.name : booking.team?.name || "Unknown",
    slot: slotFormatted,
    room: {
      'No.': booking.room.id,
      type: booking.room.roomType
    }
  };
}

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.setHours(0, 0, 0, 0));
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return [start, end];
}

module.exports = {transformBookingArrayObjects, getTodayRange}