const cancelCounts = {}

function cancelSlot(userId, martId, slotId) {
  cancelCounts[userId] = (cancelCounts[userId] || 0) + 1
  if (cancelCounts[userId] > 2) return { success: false, message: 'Daily cancellation limit exceeded' }
  return { success: true }
}

module.exports = { cancelSlot }
