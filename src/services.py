from collections import defaultdict
from datetime import date
from datetime import timedelta
import functools
import itertools
import json
import operator
from pathlib import Path
import time
from typing import Callable, Dict, Generator, List, Optional, Type, TypeVar

from diskcache import Cache
from oauthlib.oauth2 import MissingTokenError
import pydantic
import redis
from ring_doorbell import Auth
from ring_doorbell import Ring
from ring_doorbell import RingDoorBell

import exceptions
import ringbox_types as rt

RING_TOKEN_DESCRIPTION = 'Ringbox/1.0'
# TODO: Use a session cache for login tokens
RING_TOKEN_FILE = Path('ring_token.cache')

VIDEO_TYPES = ('stickup_cams', 'doorbots', 'authorized_doorbots')

URL_EVENT_PLAY = '/clients_api/dings/{event_id}/share/play?disable_redirect=true'

CACHE = Cache(directory='../.cache/')
ONE_HOUR_IN_SECONDS = 60 * 60
ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60

REDIS = redis.Redis(host='localhost', port=6379, db=0)
REDIS_KEY_LOCATION_DEVICES = 'location-devices'  # JSON string (List[LocationDevices] except devices[].history)
REDIS_KEY_EARLIEST_DATE_BY_DEVICE = 'earliest-date-by-device'  # Hashmap (devide_id, str)
REDIS_KEY_DEVICE_DAY = 'device-day-{device_id}-{day}'  # JSON string (List[Event])
REDIS_KEY_PLAY_URL = 'play-url-{device_id}-{event_id}'  # String (expiry 1 hour)

# TODO: Store this in redis too?
NEXT_CHECK: Dict[str, float] = {}
NEXT_CHECK_KEY_LOCATION_DEVICES = 'location-devices'
NEXT_CHECK_KEY_DEVICE_HISTORY = 'device-history-{device.id}'


def clear_cache():
  CACHE.clear()


def ring_token_updated(token):
  RING_TOKEN_FILE.write_text(json.dumps(token))


# TODO: Cache this properly (with timeout)
@functools.lru_cache
def get_ring(*,
             username: Optional[str] = None,
             password: Optional[str] = None,
             otp: Optional[str] = None) -> Ring:
  if RING_TOKEN_FILE.is_file():
    token_json = json.loads(RING_TOKEN_FILE.read_text())
    auth = Auth(RING_TOKEN_DESCRIPTION, token_json, ring_token_updated)
  else:
    if not (username and password):
      raise exceptions.RingMissingTokenException()
    auth = Auth(RING_TOKEN_DESCRIPTION, None, ring_token_updated)
    try:
      auth.fetch_token(username, password, otp)
    except MissingTokenError:
      raise exceptions.RingMissingOTPException()

  ring = Ring(auth)
  return ring


# TODO: Only cache for 1 hour?
@functools.lru_cache
def get_doorbell_lookup() -> Dict[str, RingDoorBell]:
  ring = get_ring()

  # Don't call update_data as that calls update_groups which fails if there are
  # no groups - and we only care about devices anyway...
  ring.update_devices()
  devices = ring.devices()

  doorbell_lookup = {}
  for _type in VIDEO_TYPES:
    for device in devices[_type]:
      doorbell_lookup[str(device.id)] = device

  return doorbell_lookup


@CACHE.memoize(expire=ONE_HOUR_IN_SECONDS)
def get_play_url(event_id: str) -> Optional[str]:
  # Doesn't exist in the library so call it ourselves
  url = URL_EVENT_PLAY.format(event_id=event_id)
  ring = get_ring()
  response = ring.query(url).json()

  if response['status'] == 'ready':
    return response['url']
  else:
    return None


PydanticModel = TypeVar('PydanticModel', bound=pydantic.BaseModel)


def rget(key: str, DataType: Type[PydanticModel]) -> Optional[PydanticModel]:
  data = REDIS.get(key)
  if data:
    return DataType.parse_raw(data)
  else:
    return None


def rset(key: str, obj: pydantic.BaseModel) -> None:
  data = obj.json()
  REDIS.set(key, data)


def rate_limit(key_template: str,
               timeout: int = ONE_HOUR_IN_SECONDS) -> Callable:

  def decorator(func: Callable) -> Callable:

    @functools.wraps(func)
    def wrapped(*args, **kwargs):
      key = key_template.format(*args, **kwargs)
      if NEXT_CHECK.get(key, 0) < time.time():
        func(*args, **kwargs)
        NEXT_CHECK[key] = time.time() + timeout

    return wrapped

  return decorator


def get_location_devices() -> rt.LocationDevicesList:
  """
  Check update location devices ()
  Load location_devices from Redis
  Return location_devices
  """
  update_location_devices()
  location_devices_list = rget(REDIS_KEY_LOCATION_DEVICES,
                               rt.LocationDevicesList)
  assert location_devices_list

  # Add earliest dates
  earliest_dates = REDIS.hgetall(REDIS_KEY_EARLIEST_DATE_BY_DEVICE)
  for location_devices in location_devices_list.locations:
    for device in location_devices.devices:
      device.earliest_date = earliest_dates.get(device.id)

  return location_devices_list


@rate_limit(NEXT_CHECK_KEY_LOCATION_DEVICES)
def update_location_devices() -> None:
  """
  Load location_devices from Ring
  Load location_devices from Redis
  Merge lists
  Save location_devices to Redis
  """
  # Get doorbell lookup from ring
  doorbell_lookup = get_doorbell_lookup()

  # Get existing device lookup
  device_lookup = {}
  location_devices_list = rget(REDIS_KEY_LOCATION_DEVICES,
                               rt.LocationDevicesList)
  if location_devices_list:
    for location_devices in location_devices_list:
      for device in location_devices.devices:
        device_lookup[device.id] = device

  # Merge/create devices and split by location
  devices_by_location: Dict[str, List[rt.Device]] = {}
  for doorbell in doorbell_lookup.values():
    # Get/create Device
    device = device_lookup.get(doorbell.id)
    if not device:
      device = rt.Device(
          id=doorbell.id,
          name=doorbell.name,
          earliest_date=None,
      )

    # Record by location
    location = doorbell.address.split(',')[0].strip()
    if location not in devices_by_location:
      devices_by_location[location] = []
    devices_by_location[location].append(device)

  result = rt.LocationDevicesList(locations=[
      rt.LocationDevices(
          name=location,
          devices=list(sorted(
              devices,
              key=operator.attrgetter('name'),
          )),
      ) for location, devices in sorted(devices_by_location.items())
  ])

  rset(REDIS_KEY_LOCATION_DEVICES, result)


def get_device_day(device_id: str, day: str) -> Optional[rt.DeviceHistoryDay]:
  """
  Check update device history (device)
  Load device-day from Redis
  Return device-day (or None if no history for that day)
  """
  get_doorbell_lookup
  update_device_history(device_id)
  return rget(REDIS_KEY_LOCATION_DEVICES.format(device_id=device_id, day=day),
              rt.DeviceHistoryDay)


@rate_limit(NEXT_CHECK_KEY_DEVICE_HISTORY)
def update_device_history(device_id: str) -> None:
  """
  Until we reach known history or day limit or end of history:
    Get first/next device history page
    Split to days
    For each day:
      Create new device-day
      If existing device-day:
        device-day = Merge device history (new device-day, existing device-day)
        If there were duplicates, break after saving
      Save device-day
  Update device.earliest_date
  """
  doorbell_lookup = get_doorbell_lookup()
  doorbell = doorbell_lookup[device_id]
  history = iter_doorbell_history(doorbell)
  grouped_date_events = itertools.groupby(history,
                                          lambda event: event.created_at.date())

  earliest_date = REDIS.hget(REDIS_KEY_EARLIEST_DATE_BY_DEVICE, device_id)
  for day, events in grouped_date_events:
    key = REDIS_KEY_DEVICE_DAY.format(device_id=device_id, day=str(day))
    dhd = rget(key, rt.DeviceHistoryDay)
    duplicate_events = False
    if not dhd:
      dhd = rt.DeviceHistoryDay(events=list(events))
    else:
      # Merge the lists of events & check for duplicates
      events_by_id = {event.id: event for event in dhd.events}
      for event in events:
        if event.id in events_by_id:
          duplicate_events = True
        else:
          events_by_id[event.id] = event
      dhd.events = list(
          sorted(events_by_id.values(), key=operator.attrgetter('created_at')))

    rset(key, dhd)

    earliest_date = min(earliest_date or day, day)

    if duplicate_events:
      break

  # Save the (possiby updated) earliest date
  REDIS.hset(REDIS_KEY_EARLIEST_DATE_BY_DEVICE, device_id, earliest_date)


def iter_doorbell_history(
    doorbell: RingDoorBell,
    page_size: int = 1000,
    max_age_days: int = 30) -> Generator[rt.Event, None, None]:
  last_event_id = None
  oldest_date = date.today() - timedelta(days=max_age_days)
  while True:
    device_history = doorbell.history(limit=page_size, older_than=last_event_id)

    # Check if we've reached the end of the device history yet
    if not device_history:
      return

    for event_info in device_history:
      event = rt.Event(
          id=event_info['id'],
          created_at=event_info['created_at'],
          duration=event_info['duration'],
          type=event_info['kind'],
      )

      # Check if we've got enough history yet
      if event.created_at < oldest_date:
        return

      yield event
