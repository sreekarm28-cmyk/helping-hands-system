function viewBookings(martId) {
  return { bookings: [{ id: 'b1', martId }] }
}

function markAttendance(userId, martId, slotId, present) {
  return { success: true }
}

module.exports = { viewBookings, markAttendance }
