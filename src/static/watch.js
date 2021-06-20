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

  const UI_CONTAINER = document.querySelector("#container_main");

  let DEVICES_BY_LOCATION;
  let EVENT_BY_ID;
  let LOCATION_INDEX = 0;
  let CHOSEN_DATE;

  let PLAYBACK_RATE = 1.0;
  let CURRENT_TIME;
  let LAST_TICK = new Date();

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

    setInterval(update_time, 500);
  };

  /* API Functions */

  function load_devices() {
    return call_api(API_DEVICES).then((data) => {
      DEVICES_BY_LOCATION = data;

      // Add start_date to and end_date to events & make a lookup
      EVENT_BY_ID = {};
      DEVICES_BY_LOCATION.forEach((location) => {
        location.devices.forEach((device) => {
          Object.values(device.history).forEach((events) => {
            events.forEach((event) => {
              const createdAt = new Date(event.created_at);
              event.start_date = createdAt;
              event.end_date = new Date(
                createdAt.getTime() + event.duration * 1000
              );

              EVENT_BY_ID[event.id] = event;
            });
          });
        });
      });
    });
  }

  /* UI Population */

  function populate_ui() {
    const chosen_location = DEVICES_BY_LOCATION[LOCATION_INDEX];

    // Ensure the current date is valid
    if (chosen_location.event_count_by_date[CHOSEN_DATE] === undefined) {
      CHOSEN_DATE = Object.keys(chosen_location.event_count_by_date)[0];
    }

    // Reset to no time until a video is played
    CURRENT_TIME = undefined;

    UI_CONTAINER.innerHTML = NUNJUCKS.render("ui.tpl", {
      chosen_date: CHOSEN_DATE,
      chosen_location: chosen_location,
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
    const eventId = event.target.dataset.eventId;
    set_time(EVENT_BY_ID[eventId].start_date);
  }

  function handle_speed_control(event) {
    PLAYBACK_RATE = event.target.value;

    console.log(`All: Setting playback rate to ${PLAYBACK_RATE}`);

    document.querySelectorAll("video").forEach((video) => {
      video.defaultPlaybackRate = PLAYBACK_RATE;
      video.playbackRate = PLAYBACK_RATE;
    });
  }

  /* Time Management */

  function set_time(time) {
    console.log(`All: Setting time: ${time}`);
    CURRENT_TIME = new Date(time);
    render_time();
  }

  function update_time() {
    // TODO: Tick time (with speed control)
    if (CURRENT_TIME !== undefined) {
      const thisTick = new Date();
      const tickMilliseconds = thisTick - LAST_TICK;
      const advanceMilliseconds = tickMilliseconds * PLAYBACK_RATE;
      CURRENT_TIME.setTime(CURRENT_TIME.getTime() + advanceMilliseconds);
      LAST_TICK = thisTick;
    }
    render_time();
  }

  function render_time() {
    /*
    If no CURRENT_TIME:
      Clear time display
      Exit

    Set time display

    For each device:
      If there's an event playing:
        If the event is still in time:
          If the time is off:
            Set playback time
          Continue

      If there's an event for the current time:
        Get play URL
        Set source
        Highlight this event
      Else:
        If an event is set on the video:
          Clear the source
          Clear highlight event
    */

    // Update time display
    const timeElement = document.querySelector(`#time_display`);
    if (CURRENT_TIME === undefined) {
      timeElement.innerHTML = "??:??:??";
      return;
    }
    timeElement.innerHTML = CURRENT_TIME.toLocaleTimeString();

    // Iterate over devices
    const chosen_location = DEVICES_BY_LOCATION[LOCATION_INDEX];
    chosen_location.devices.forEach((device) => {
      const sourceElement = document.querySelector(
        `#video_${device.id} source`
      );

      // Check if the current event is still valid
      const currentEvent = EVENT_BY_ID[sourceElement.dataset.currentEventId];
      if (currentEvent) {
        if (
          currentEvent.start_date <= CURRENT_TIME &&
          CURRENT_TIME <= currentEvent.end_date
        ) {
          // Check video time is correct
          const expectedTime =
            (CURRENT_TIME.getTime() - currentEvent.start_date.getTime()) / 1000;
          const videoTime = sourceElement.parentElement.currentTime;
          const offset = videoTime - expectedTime;
          if (Math.abs(offset) > PLAYBACK_RATE) {
            // Possibly need to set to the next expected time so it has time to seek...
            console.log(`Fixing time for ${device.id} (offset ${offset})...`);
            sourceElement.parentElement.currentTime = expectedTime;
          }
          return;
        }
      }

      // Find event for the current time
      const nowEvent = findEvent(device, CURRENT_TIME);
      if (nowEvent) {
        // Start playback
        console.log(nowEvent);
        playEvent(sourceElement, device.id, nowEvent.id);
      } else {
        if (currentEvent) {
          // Clear playback
          playEvent(sourceElement, device.id);
        }
      }
    });
  }

  function findEvent(device, time) {
    // Get history for the current day
    const dayEvents = device.history[CHOSEN_DATE];
    if (dayEvents === undefined) {
      return;
    }

    // Get the current event
    const nowEvents = dayEvents.filter((event) => {
      return event.start_date <= time && time <= event.end_date;
    });

    if (nowEvents) {
      return nowEvents[0];
    }
  }

  function playEvent(sourceElement, deviceId, eventId) {
    console.log(`${deviceId}: Playing ${eventId}`);

    // Play/clear the video
    sourceElement.dataset.currentEventId = eventId;
    if (eventId) {
      sourceElement.src = `/play/${eventId}/`;
    } else {
      sourceElement.removeAttribute("src");
    }
    sourceElement.parentElement.load();

    // Remove highlight
    document
      .querySelectorAll(`#history_${deviceId} button.playing`)
      .forEach((ele) => {
        ele.classList.remove("playing");
      });

    if (eventId) {
      // Highlight currently playing video
      document
        .querySelector(
          `#history_${deviceId} button[data-event-id="${eventId}"]`
        )
        .classList.add("playing");
    }
  }

  /* Utility Functions */

  function call_api(url, payload) {
    console.log(`Fetching ${url}`);

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
              console.error(msg, text);
              return reject(msg);
            });
          } else {
            response.json().then((data) => {
              console.log(
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
          console.error(msg, response.text());
          return reject(msg);
        });
    });
  }
})();
