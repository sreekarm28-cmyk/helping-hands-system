const assert = require("assert");
const { addUser, removeUser } = require("../src/main_admin_users");

describe("Main Admin - User Management Tests", () => {

    it("should register a new user", () => {
        const result = addUser({ id: "user10", name: "Test User" });
        assert.strictEqual(result.success, true);
    });

    it("should remove an existing user", () => {
        const result = removeUser("user10");
        assert.strictEqual(result.success, true);
    });

});
