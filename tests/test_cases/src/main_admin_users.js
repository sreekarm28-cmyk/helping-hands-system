const users = new Map()

function addUser(user) {
  users.set(user.id, user)
  return { success: true }
}

function removeUser(id) {
  users.delete(id)
  return { success: true }
}

module.exports = { addUser, removeUser }
