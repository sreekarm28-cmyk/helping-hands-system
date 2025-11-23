const assert = require("assert");
const { markAttendance } = require("../src/store_admin_attendance");

describe("FR-13: Store Admin Mark Attendance Tests", () => {

    it("should mark user as present", () => {
        const result = markAttendance("user1", "mart1", "slot1", true);
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.attendance, "present");
    });

    it("should mark user as absent", () => {
        const result = markAttendance("user2", "mart1", "slot2", false);
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.attendance, "absent");
    });

    it("should fail for non-existent user", () => {
        const result = markAttendance("ghostUser", "mart1", "slot1", true);
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.message, "User not found");
    });

    it("should fail for invalid mart or slot", () => {
        const result = markAttendance("user1", "fakeMart", "slot1", true);
        assert.strictEqual(result.success, false);
    });

});
