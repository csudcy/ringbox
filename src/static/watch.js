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

  const UI_VIDEOS = document.querySelector("#video_container");
  const UI_CONTROLS = document.querySelector("#controls_container");
  const UI_VIDEOS_HISTORY = document.querySelector("#history_container");

  let DEVICES_BY_LOCATION;

  nunjucks.configure("/static/templates", { autoescape: true });

  window.onload = function () {
    console.log("Hello!");
    load_devices().then(populate_ui);
  };

  function load_devices() {
    return call_api(API_DEVICES).then((data) => {
      DEVICES_BY_LOCATION = data;
    });
  }

  function populate_ui() {
    let context = { devices_by_location: DEVICES_BY_LOCATION };
    UI_VIDEOS.innerHTML = nunjucks.render("video.tpl", context);
    UI_CONTROLS.innerHTML = nunjucks.render("controls.tpl", context);
    UI_VIDEOS_HISTORY.innerHTML = nunjucks.render("history.tpl", context);
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
