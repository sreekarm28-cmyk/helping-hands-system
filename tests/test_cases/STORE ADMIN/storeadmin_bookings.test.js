const assert = require("assert");
const { viewBookings, markAttendance } = require("../src/store_admin_bookings");

describe("Store Admin - Manage Bookings Tests", () => {

    it("should show bookings for mart", () => {
        const result = viewBookings("mart1");
        assert.ok(result.bookings);
    });

    it("should mark user attendance", () => {
        const result = markAttendance("user1", "mart1", "slot1", true);
        assert.strictEqual(result.success, true);
    });

});
