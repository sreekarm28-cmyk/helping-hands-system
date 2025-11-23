function updateStoreDetails(martId, details) {
  if (!details || !details.name) return { success: false }
  return { success: true }
}

module.exports = { updateStoreDetails }
