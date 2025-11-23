const assert = require("assert");
const { cancelSlot } = require("../src/cancellation");

describe("Cancellation Limit Tests", () => {

    it("should allow cancellation if limit is not exceeded", () => {
        const result = cancelSlot("user1", "mart1", "slot1");
        assert.strictEqual(result.success, true);
    });

    it("should block cancellation after 2 cancellations", () => {
        cancelSlot("user1", "mart1", "slot2");
        cancelSlot("user1", "mart1", "slot3");
        const result = cancelSlot("user1", "mart1", "slot4");
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.message, "Daily cancellation limit exceeded");
    });

});
