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

  const DEVICE_COLOURS = [
    "red",
    "green",
    "blue",
    "purple",
    "black"
  ];

  const API_DEVICES = "/api/devices/";
  const API_HISTORY = "/api/devices/{device_id}/history/{day}/";

  const UI_CONTAINER = document.querySelector("#container_main");

  let DEVICES_BY_LOCATION;
  let EVENT_BY_ID;
  let CHOSEN_LOCATION_INDEX = 0;
  let CHOSEN_DATE = new Date();

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
    load_devices().then(load_history).then(populate_ui);

    // setInterval(update_time, 500);
  };

  /* API Functions */

  function load_devices() {
    return call_api(API_DEVICES).then((data) => {
      DEVICES_BY_LOCATION = data;

      // // Add start_date to and end_date to events & make a lookup
      // EVENT_BY_ID = {};
      // DEVICES_BY_LOCATION.locations.forEach((location) => {
      //   location.devices.forEach((device) => {
      //     Object.values(device.history).forEach((events) => {
      //       events.forEach((event) => {
      //         const createdAt = new Date(event.created_at);
      //         event.start_date = createdAt;
      //         event.end_date = new Date(
      //           createdAt.getTime() + event.duration * 1000
      //         );

      //         EVENT_BY_ID[event.id] = event;
      //       });
      //     });
      //   });
      // });
    });
  }

  function load_history() {
    // TODO
    const chosen_location = DEVICES_BY_LOCATION.locations[CHOSEN_LOCATION_INDEX];
    const api_calls = chosen_location.devices.slice(0,1).map((device) => {
      console.log(device);
      const url = API_HISTORY.replace("{device_id}", device.id).replace(
        "{day}",
        get_day(CHOSEN_DATE)
      );
      return call_api(url).then((history) => {
        console.log(history);
      });
    });

    return Promise.all(api_calls);
  }

  /* UI Population */

  function populate_ui() {
    console.log('POPULATE');
    return;
    const chosen_location = DEVICES_BY_LOCATION.locations[CHOSEN_LOCATION_INDEX];

    // // Ensure the current date is valid
    // if (chosen_location.event_count_by_date[CHOSEN_DATE] === undefined) {
    //   CHOSEN_DATE = Object.keys(chosen_location.event_count_by_date)[0];
    // }

    // Reset to no time until a video is played
    CURRENT_TIME = undefined;

    UI_CONTAINER.innerHTML = NUNJUCKS.render("ui.tpl", {
      chosen_date: CHOSEN_DATE,
      chosen_location: chosen_location,
      devices_by_location: DEVICES_BY_LOCATION,
      chosen_location_index: CHOSEN_LOCATION_INDEX,
    });

    // Add handlers
    UI_CONTAINER.querySelectorAll("button").forEach((button) => {
      button.onclick = handle_play_button;
    });

    UI_CONTAINER.querySelectorAll("#speed_control input").forEach((input) => {
      input.onclick = handle_speed_control;
    });

    UI_CONTAINER.querySelector("#locations").onchange = handle_location_select;
    UI_CONTAINER.querySelector("#dates").onchange = handle_date_select;

    // Draw the history bar
    const timeline = document.querySelector("#timeline");
    const ctx = timeline.getContext("2d");
    const fullHeight = 10 * chosen_location.devices.length;

    // Fill the background
    ctx.fillStyle = "#ccc";
    ctx.fillRect(0, 0, 1440, fullHeight);

    // Draw hour lines
    ctx.fillStyle = "black";
    for (let minute=0; minute<1440; minute += 3 * 60) {
      ctx.fillRect(minute, 0, 2, fullHeight);
    }

    // Draw the events
    chosen_location.devices.forEach((device, index) => {
      const events = device.history[CHOSEN_DATE];
      if (events) {
        ctx.fillStyle = DEVICE_COLOURS[index];
        device.history[CHOSEN_DATE].forEach((event) => {
          const startMinute =
            event.start_date.getHours() * 60 + event.start_date.getMinutes();
          ctx.fillRect(startMinute, index * 10, 2, 10);
        });
      }
    });
  }

  /* UI Handlers */

  function handle_play_button(event) {
    const eventId = event.target.dataset.eventId;
    set_time(EVENT_BY_ID[eventId].start_date);
  }

  function handle_speed_control(event) {
    PLAYBACK_RATE = parseFloat(event.target.value);

    console.log(`All: Setting playback rate to ${PLAYBACK_RATE}`);

    document.querySelectorAll("video").forEach((video) => {
      video.defaultPlaybackRate = PLAYBACK_RATE;
      video.playbackRate = PLAYBACK_RATE;
    });
  }

  function handle_location_select(event) {
    CHOSEN_LOCATION_INDEX = parseInt(event.target.value);
    console.log(`All: Setting location to: ${CHOSEN_LOCATION_INDEX}`);
    populate_ui();
  };

  function handle_date_select(event) {
    CHOSEN_DATE = event.target.value;
    console.log(`All: Setting date to: ${CHOSEN_DATE}`);
    populate_ui();
  };

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

    const timeSlider = document.querySelector(`#time_slider`);
    timeSlider.value = 60 * CURRENT_TIME.getHours() + CURRENT_TIME.getMinutes();

    // Iterate over devices
    const chosen_location = DEVICES_BY_LOCATION.locations[CHOSEN_LOCATION_INDEX];
    chosen_location.devices.forEach((device) => {
      const sourceElement = document.querySelector(
        `#video_${device.id} source`
      );

      // Check if the current event is still valid
      const currentEvent = EVENT_BY_ID[sourceElement.dataset.currentEventId];
      if (
        currentEvent &&
        currentEvent.start_date <= CURRENT_TIME &&
        CURRENT_TIME <= currentEvent.end_date
      ) {
        // Check video time is correct
        const expectedTimeSeconds =
          (CURRENT_TIME.getTime() - currentEvent.start_date.getTime()) / 1000;
        const videoTimeSeconds = sourceElement.parentElement.currentTime;
        const offsetSeconds = videoTimeSeconds - expectedTimeSeconds;
        if (Math.abs(offsetSeconds) > 2 * PLAYBACK_RATE) {
          // If we're really far off, just seek to it
          // Possibly need to set to the next expected time so it has time to seek...
          console.log(`${device.id}: Setting currentTime`, {
            offsetSeconds: offsetSeconds,
          });
          sourceElement.parentElement.currentTime = expectedTimeSeconds;
        } else if (Math.abs(offsetSeconds) > PLAYBACK_RATE) {
          // If we're not too far away, try to catch up/back
          let playbackRateDelta = PLAYBACK_RATE / 4;
          if (offsetSeconds > 0) {
            playbackRateDelta = -playbackRateDelta;
          }
          const currentPlaybackRate = sourceElement.parentElement.playbackRate;
          let newPlaybackRate = currentPlaybackRate + playbackRateDelta;
          // Make sure new playback rate is reasonable
          if (newPlaybackRate <= 0) {
            newPlaybackRate = 0.1;
          } else if (newPlaybackRate >= 16) {
            newPlaybackRate = 16.0;
          }
          console.log(`${device.id}: Setting PlaybackRate`, {
            offsetSeconds: offsetSeconds,
            currentPlaybackRate: currentPlaybackRate,
            playbackRateDelta: playbackRateDelta,
            newPlaybackRate: newPlaybackRate,
          });
          sourceElement.parentElement.playbackRate = newPlaybackRate;
        } else if (sourceElement.parentElement.playbackRate !== PLAYBACK_RATE) {
          console.log(`${device.id}: Resetting PlaybackRate`, {
            offsetSeconds: offsetSeconds,
          });
          sourceElement.parentElement.playbackRate = PLAYBACK_RATE;
        }
      } else {
        // Find event for the current time
        const nowEvent = findEvent(device, CURRENT_TIME);
        if (nowEvent) {
          // Start playback
          playEvent(sourceElement, device.id, nowEvent.id);
        } else {
          if (currentEvent) {
            // Clear playback
            playEvent(sourceElement, device.id);
          }
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

  function get_day(date) {
    return date.toISOString().substring(0, 10);
  }
})();
