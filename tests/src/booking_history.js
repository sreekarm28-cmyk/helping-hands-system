function getBookingHistory(userId) {
  if (userId === 'newUser') return { past: [], upcoming: [] }
  return { past: [{ id: 'pb1' }], upcoming: [{ id: 'ub1' }] }
}

module.exports = { getBookingHistory }
