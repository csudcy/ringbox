# ringbox

A server which allows you to view multiple Ring timelines at once.


# Setup

* Install:
  * `nvm`
  * `poetry`
  * `pyenv`
* Run:
```
pyenv install
nvm install

nvm use
npm run deps:install

# If you get issues with poetry not using wheels when it should, you can try:
poetry config experimental.new-installer false
npm run deps:install
```


# Run

```
nvm use
npm run serve
```


# Todo

* Proper session based login
* Proper caching
* Download videos locally to stream?


# Redis

```
Keys:
* location_devices : JSON string (List[LocationDevices] except devices[].history)
* device-day-{device_id}-{day} : JSON string (List[Event])
* play-url-{device_id}-{event_id}: String (expiry 1 hour)

Behaviour:
* Get location devices ():
  Check update location devices ()
  Load location_devices from Redis
  Return location_devices

* Check update location devices ():
  If more than 1 hour since checked:
    Update location devices

* Update location devices ():
  Load location_devices from Redis
  Check for new devices
  For new devices, get activity history
  Save location_devices to Redis
  Return location_devices

* Get device day (device, day):
  Check update device history (device)
  Load device-day from Redis
  Return device-day (or None if no history for that day)

* Check update device history (device):
  If more than 1 hour since checked:
    Update device history (device)

* Update device history (device):
  Until we reach known history or day limit or end of history:
    Get first/next device history page
    Split to days
    For each day:
      Create new device-day
      If existing device-day:
        device-day = Merge device history (new device-day, existing device-day)
        If there were duplicates, break after saving
      Save device-day

* Merge device history (device-day-1, device-day-2) -> device-day, has_duplicates:
  Check both device-days for the same device & day
  Make a new device-day
  Combine, order, and unique events
  Return ...
```
