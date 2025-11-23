const assert = require("assert");
const { getMartDetails } = require("../src/mart");

describe("Mart Details Tests", () => {

    it("should show mart details correctly", () => {
        const result = getMartDetails("mart1");
        assert.strictEqual(result.id, "mart1");
        assert.ok(result.sections);
    });

    it("should return error for invalid mart", () => {
        const result = getMartDetails("randomMart");
        assert.strictEqual(result.success, false);
    });

});
