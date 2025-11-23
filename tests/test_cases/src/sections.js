const sectionsByMart = new Map()

function addSection(martId, name) {
  const list = sectionsByMart.get(martId) || []
  list.push({ name })
  sectionsByMart.set(martId, list)
  return { success: true }
}

function updateSectionLimit(martId, sectionName, limit) {
  return { success: true }
}

function removeSection(martId, sectionName) {
  return { success: true }
}

module.exports = { addSection, removeSection, updateSectionLimit }
