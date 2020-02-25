/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

const shim = require("fabric-shim");

var Chaincode = class {
  // Initialize the chaincode
  async Init(stub) {
    console.info("============= START : Initialize Ledger ===========");
    const gadgets = [
      {
        color: "blue",
        make: "Hp",
        model: "Probook",
        owner: "Tomoko"
      },
      {
        color: "red",
        make: "Apple",
        model: "Macbook Air",
        owner: "Brad"
      }
    ];
    for (let i = 0; i < gadgets.length; i++) {
      gadgets[i].docType = "gadget";
      await stub.putState("GD" + i, Buffer.from(JSON.stringify(gadgets[i])));
      console.info("Added <--> ", gadgets[i]);
    }
    console.info("============= END : Initialize Ledger ===========");
    return shim.success();
  }

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    let method = this[ret.fcn];
    if (!method) {
      console.error("no method of name:" + ret.fcn + " found");
      return shim.error("no method of name:" + ret.fcn + " found");
    }

    console.info("\nCalling method : " + ret.fcn);
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async createGadget(stub, args) {
    console.info("============= START : Create Gadget ===========");
    if (args.length != 5) {
      throw new Error("Incorrect number of arguments. Expecting 5");
    }
    var gadgetId = args[0];
    var color = args[1];
    var make = args[2];
    var model = args[3];
    var owner = args[4];
    if (!gadgetId || !color || !make || !model || !owner) {
      throw new Error("arguments must not be empty");
    }
    const gadget = {
      color,
      docType: "gadget",
      make,
      model,
      owner
    };

    await stub.putState(gadgetId, Buffer.from(JSON.stringify(gadget)));
    console.info("============= END : Create Gadget ===========");
  }

  // Deletes an entity from state
  async queryAll(stub) {
    const startKey = "GD0";
    const endKey = "GD999";

    const iterator = await stub.getStateByRange(startKey, endKey);

    const allResults = [];
    while (true) {
      const res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        console.log(res.value.value.toString("utf8"));

        const Key = res.value.key;
        let Record;
        try {
          Record = JSON.parse(res.value.value.toString("utf8"));
        } catch (err) {
          console.log(err);
          Record = res.value.value.toString("utf8");
        }
        allResults.push({ Key, Record });
      }
      if (res.done) {
        console.log("end of data");
        await iterator.close();
        console.info(allResults);
        var result = JSON.stringify(allResults);
        return Buffer.from(result);
      }
    }
  }

  // query callback representing the query of a chaincode
  async changeOwner(stub, args) {
    console.info("============= START : changeGadgetOwner ===========");
    var gadgetId = args[0];
    var newOwner = args[1];
    const gdAsBytes = await stub.getState(gadgetId);
    if (!gdAsBytes || gdAsBytes.length === 0) {
      throw new Error(`${gadgetId} does not exist`);
    }
    const gd = JSON.parse(gdAsBytes.toString());
    gd.owner = newOwner;

    await stub.putState(gadgetId, Buffer.from(JSON.stringify(gd)));
    console.info("============= END : changeGadgetOwner ===========");
  }
};

shim.start(new Chaincode());
