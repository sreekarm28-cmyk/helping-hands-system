const assert = require("assert");
const { getBookingHistory } = require("../src/booking_history");

describe("Booking History Tests", () => {

    it("should return past and upcoming bookings", () => {
        const result = getBookingHistory("user1");
        assert.ok(result.past);
        assert.ok(result.upcoming);
    });

    it("should return empty lists if user has no history", () => {
        const result = getBookingHistory("newUser");
        assert.strictEqual(result.past.length, 0);
        assert.strictEqual(result.upcoming.length, 0);
    });

});
