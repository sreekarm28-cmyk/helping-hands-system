const stores = new Map()

function addStore(store) {
  stores.set(store.id, store)
  return { success: true }
}

function removeStore(id) {
  stores.delete(id)
  return { success: true }
}

module.exports = { addStore, removeStore }
