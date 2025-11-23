const assert = require("assert");
const { updateStoreDetails } = require("../src/store_admin");

describe("Store Admin - Store Details Tests", () => {

    it("should update store details successfully", () => {
        const result = updateStoreDetails("mart1", { name: "Mega Mart", size: "Large" });
        assert.strictEqual(result.success, true);
    });

    it("should fail for missing fields", () => {
        const result = updateStoreDetails("mart1", { name: "" });
        assert.strictEqual(result.success, false);
    });

});
