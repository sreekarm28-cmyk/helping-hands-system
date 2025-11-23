const assert = require("assert");
const { bookSlot } = require("../src/slot_booking");

describe("Slot Booking Tests", () => {

    it("should book a slot successfully when available", () => {
        const result = bookSlot("user1", "mart1", "electronics", "10AM");
        assert.strictEqual(result.success, true);
    });

    it("should not book a slot that is full", () => {
        const result = bookSlot("user2", "mart1", "electronics", "10AM");
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.message, "Slot Full");
    });

    it("should not book if invalid section is selected", () => {
        const result = bookSlot("user3", "mart1", "toys", "10AM");
        assert.strictEqual(result.success, false);
    });

});
