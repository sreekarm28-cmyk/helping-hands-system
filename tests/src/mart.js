function getMartDetails(martId) {
  if (martId !== 'mart1') return { success: false }
  return { id: 'mart1', sections: ['electronics', 'billing'] }
}

module.exports = { getMartDetails }
