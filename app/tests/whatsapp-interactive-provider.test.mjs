import test from "node:test";
import assert from "node:assert/strict";
import {
  sendWhatsAppButtonsMessage,
  sendWhatsAppListMessage,
} from "../src/lib/whatsapp/provider.ts";

function withMetaEnv(fn) {
  return async () => {
    const previousToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
    const previousId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;
    process.env.WHATSAPP_CLOUD_ACCESS_TOKEN = "test-token";
    process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID = "phone-id";
    const originalFetch = global.fetch;
    try {
      await fn();
    } finally {
      global.fetch = originalFetch;
      if (previousToken === undefined) delete process.env.WHATSAPP_CLOUD_ACCESS_TOKEN; else process.env.WHATSAPP_CLOUD_ACCESS_TOKEN = previousToken;
      if (previousId === undefined) delete process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID; else process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID = previousId;
    }
  };
}

test(
  "buttons message sends a correctly-shaped interactive reply-button payload",
  withMetaEnv(async () => {
    let request;
    global.fetch = async (_url, options) => {
      request = JSON.parse(options.body);
      return {ok: true, status: 200, json: async () => ({messages: [{id: "wamid.1"}]})};
    };

    const result = await sendWhatsAppButtonsMessage({
      to: "+2348111218286",
      body: "What would you like to do?",
      buttons: [
        {id: "menu_browse", title: "Browse & Order"},
        {id: "menu_track", title: "Track my order"},
      ],
    });

    assert.equal(request.type, "interactive");
    assert.equal(request.interactive.type, "button");
    assert.equal(request.interactive.action.buttons.length, 2);
    assert.equal(request.interactive.action.buttons[0].reply.id, "menu_browse");
    assert.equal(result.normalizedTo, "2348111218286");
  }),
);

test(
  "buttons message rejects more than 3 buttons before calling the API",
  withMetaEnv(async () => {
    global.fetch = async () => {
      throw new Error("fetch should not be called for an invalid button count");
    };

    await assert.rejects(
      () =>
        sendWhatsAppButtonsMessage({
          to: "+2348111218286",
          body: "Too many options",
          buttons: [
            {id: "a", title: "A"},
            {id: "b", title: "B"},
            {id: "c", title: "C"},
            {id: "d", title: "D"},
          ],
        }),
      /1-3 buttons/,
    );
  }),
);

test(
  "list message sends sections/rows and caps at 10 total rows",
  withMetaEnv(async () => {
    let request;
    global.fetch = async (_url, options) => {
      request = JSON.parse(options.body);
      return {ok: true, status: 200, json: async () => ({messages: [{id: "wamid.2"}]})};
    };

    await sendWhatsAppListMessage({
      to: "2348111218286",
      header: "Today's produce",
      body: "Pick an item",
      buttonLabel: "View items",
      sections: [{title: "Available now", rows: [{id: "product_1", title: "Tomatoes", description: "₦2,000 / basket"}]}],
    });

    assert.equal(request.interactive.type, "list");
    assert.equal(request.interactive.action.sections[0].rows[0].id, "product_1");

    await assert.rejects(
      () =>
        sendWhatsAppListMessage({
          to: "2348111218286",
          body: "Too many rows",
          buttonLabel: "View",
          sections: [{title: "All", rows: Array.from({length: 11}, (_, i) => ({id: `p${i}`, title: `Item ${i}`}))}],
        }),
      /1-10 total rows/,
    );
  }),
);
