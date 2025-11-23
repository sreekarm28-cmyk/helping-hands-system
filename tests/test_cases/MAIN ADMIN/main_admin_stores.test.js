const assert = require("assert");
const { addStore, removeStore } = require("../src/main_admin_stores");

describe("Main Admin - Store Management Tests", () => {

    it("should add a new store", () => {
        const result = addStore({ id: "mart50", name: "Test Mart" });
        assert.strictEqual(result.success, true);
    });

    it("should remove an existing store", () => {
        const result = removeStore("mart50");
        assert.strictEqual(result.success, true);
    });

});
