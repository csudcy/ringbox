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
  ("use strict");

  const API_DEVICES = "/api/devices/";
  const API_EVENT_PLAY = "/api/event/play/";

  const UI_CONTAINER = document.querySelector("#container_main");

  let DEVICES_BY_LOCATION;
  let LOCATION_INDEX = 0;
  let CHOSEN_DATE;

  const NUNJUCKS = nunjucks.configure("/static/templates", {
    autoescape: true,
  });

  NUNJUCKS.addFilter("nice_time", (dt_string) => {
    const dt = new Date(dt_string);
    return dt.toLocaleTimeString();
  });

  window.onload = function () {
    UI_CONTAINER.innerHTML = "Loading devices...";
    load_devices().then(() => {
      populate_ui();
    });
  };

  /* API Functions */

  function load_devices() {
    return call_api(API_DEVICES).then((data) => {
      DEVICES_BY_LOCATION = data;
    });
  }

  function get_play_url(eventId) {
    return call_api(`${API_EVENT_PLAY}?event_ids=${eventId}`);
  }

  /* UI Population */

  function populate_ui() {
    let chosen_location = DEVICES_BY_LOCATION[LOCATION_INDEX];
    let dates = [];
    for (
      let dt = new Date(chosen_location.date_range.start_date);
      dt <= new Date(chosen_location.date_range.end_date);
      dt.setDate(dt.getDate() + 1)
    ) {
      dates.unshift(dt.toISOString().slice(0, 10));
    }

    // Ensure the current date is valid
    if (dates.indexOf(CHOSEN_DATE) == -1) {
      CHOSEN_DATE = dates[0];
    }

    UI_CONTAINER.innerHTML = NUNJUCKS.render("ui.tpl", {
      chosen_date: CHOSEN_DATE,
      chosen_location: chosen_location,
      dates: dates,
      devices_by_location: DEVICES_BY_LOCATION,
      location_index: LOCATION_INDEX,
    });

    // Add handlers
    UI_CONTAINER.querySelectorAll("button").forEach((button) => {
      button.onclick = handle_play_button;
    });

    UI_CONTAINER.querySelectorAll("#speed_control input").forEach((input) => {
      input.onclick = handle_speed_control;
    });
  }

  /* UI Handlers */

  function handle_play_button(event) {
    const deviceId = event.target.dataset.deviceId;
    const eventId = event.target.dataset.eventId;
    const sourceElement = document.querySelector(`#video_${deviceId} source`);

    log_info(`Playing ${deviceId} / ${eventId}`);

    sourceElement.src = "";
    get_play_url(eventId).then((urlByEventId) => {
      sourceElement.src = urlByEventId[eventId];
      sourceElement.parentElement.load();
    });

    // Highlight currently playing video
    document
      .querySelectorAll(`[data-device-id="${deviceId}"].playing`)
      .forEach((ele) => {
        ele.classList.remove("playing");
      });
    document
      .querySelectorAll(
        `[data-device-id="${deviceId}"][data-event-id="${eventId}"]`
      )
      .forEach((ele) => {
        ele.classList.add("playing");
      });
  }

  function handle_speed_control(event) {
    const playbackRate = event.target.value;

    log_info(`Setting playback rate to ${playbackRate}`);

    document.querySelectorAll("video").forEach((video) => {
      video.defaultPlaybackRate = playbackRate;
      video.playbackRate = playbackRate;
    });
  }

  /* Utility Functions */

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
