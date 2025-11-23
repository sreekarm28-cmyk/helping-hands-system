const assert = require("assert");
const { addSection, removeSection, updateSectionLimit } = require("../src/sections");

describe("Store Admin - Section Management Tests", () => {

    it("should add a new section", () => {
        const result = addSection("mart1", "Customer Support");
        assert.strictEqual(result.success, true);
    });

    it("should update manpower requirement", () => {
        const result = updateSectionLimit("mart1", "billing", 5);
        assert.strictEqual(result.success, true);
    });

    it("should remove a section", () => {
        const result = removeSection("mart1", "electronics");
        assert.strictEqual(result.success, true);
    });

});
