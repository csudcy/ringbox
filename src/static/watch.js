/*
TODO:
* Video per device
* Controls:
  * Location switcher?
  * Pause, 0.5x, 1x, 2x, 6x, 12x, 30x, 60x
  * Date picker
  * Time controls with per device highlighting
* History list per device
* Device chooser (later)
*/

//   <video autoplay="" loop="" controls="" playsinline="" muted="" src=""></video>

(() => {
  "use strict";

  const API_DEVICES = "/api/devices/";
  const API_DEVICES_HISTORY = "/api/devices/history/";
  const API_EVENT_PLAY = "/api/event/play/";

  const UI_CONTAINER = document.querySelector("#container_main");

  let DEVICES_BY_LOCATION;
  let DEVICES_HISTORY;
  let LOCATION_INDEX;

  nunjucks.configure("/static/templates", { autoescape: true });

  window.onload = function () {
    UI_CONTAINER.innerHTML = "Loading devices...";
    load_devices().then(() => {
      // Reset to the first location
      LOCATION_INDEX = 0;
      populate_ui();
      // UI_CONTAINER.innerHTML = "Loading history for {}...";
      // load_history().then(populate_ui);
    });
  };

  function load_devices() {
    return call_api(API_DEVICES).then((data) => {
      DEVICES_BY_LOCATION = data;
    });
  }

  function load_history(device) {
    //
  }

  function populate_ui() {
    UI_CONTAINER.innerHTML = nunjucks.render("ui.tpl", {
      location_index: LOCATION_INDEX,
      chosen_location: DEVICES_BY_LOCATION[LOCATION_INDEX],
      devices_by_location: DEVICES_BY_LOCATION,
    });
  }

  /* Utility functions */

  function log_debug(title, detail) {
    console.log(`DEBUG: ${title}`, detail);
  }

  function log_info(title, detail) {
    console.log(`INFO: ${title}`, detail);
  }

  function log_error(title, detail) {
    console.log(`ERROR: ${title}`, detail);
  }

  function call_api(url, payload) {
    log_debug(`Fetching ${url}`);

    let parameters = null;
    if (payload) {
      parameters = {
        method: "POST",
        headers: {
          "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: Object.entries(payload)
          .map((kv) => kv.map(encodeURIComponent).join("="))
          .join("&"),
      };
    } else {
      parameters = {
        method: "GET",
      };
    }

    return new Promise((resolve, reject) => {
      fetch(url, parameters)
        .then((response) => {
          const CONTENT_TYPE = response.headers.get("content-type");
          if (CONTENT_TYPE && CONTENT_TYPE.indexOf("application/json") == -1) {
            response.text().then((text) => {
              const msg = `${parameters.method} ${url} returned non-JSON response (code ${response.status})!`;
              log_error(msg, text);
              return reject(msg);
            });
          } else {
            response.json().then((data) => {
              log_debug(
                `${parameters.method} ${url} returned JSON (code ${response.status}).`,
                data
              );
              return resolve(data);
            });
          }
        })
        .catch((response) => {
          console.error(response);
          const msg = `${parameters.method} ${url} failed!`;
          log_error(msg, response.text());
          return reject(msg);
        });
    });
  }
})();
