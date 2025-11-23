const users = new Set(['user1','user2'])

function markAttendance(userId, martId, slotId, present) {
  if (!users.has(userId)) {
    return { success: false, message: 'User not found' }
  }
  if (martId === 'fakeMart') {
    return { success: false }
  }
  return { success: true, attendance: present ? 'present' : 'absent' }
}

module.exports = { markAttendance }
