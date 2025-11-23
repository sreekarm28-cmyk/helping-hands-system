function selectSection(userId, martId, section) {
  if (martId !== 'mart1') return { success: false }
  if (section === 'invalid_section') return { success: false, message: 'Section not available' }
  return { success: true, section }
}

module.exports = { selectSection }
