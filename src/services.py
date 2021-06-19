from datetime import date, datetime
import functools
import json
import operator
from pathlib import Path
from pprint import pp
from typing import Dict, List, Optional

from diskcache import Cache
from oauthlib.oauth2 import MissingTokenError
import requests
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


@CACHE.memoize(expire=ONE_YEAR_IN_SECONDS)
def get_locations() -> List[rt.LocationDevices]:
  doorbell_lookup = get_doorbell_lookup()

  devices_by_location: Dict[str, List[re.Device]] = {}
  for doorbell in doorbell_lookup.values():
    location = doorbell.address.split(',')[0].strip()
    if location not in devices_by_location:
      devices_by_location[location] = []
    devices_by_location[location].append(get_doorbell_history(doorbell))

  location_list = sorted(devices_by_location.items())
  return [
      rt.LocationDevices(
          name=location,
          devices=list(sorted(
              devices,
              key=operator.attrgetter('name'),
          )),
          date_range=rt.DateRange(
              start_date=min(
                  [device.date_range.start_date for device in devices]),
              end_date=max([device.date_range.end_date for device in devices]),
          ),
      ) for location, devices in location_list
  ]


@functools.lru_cache
def get_doorbell_history(doorbell: RingDoorBell,
                         limit: int = 1000) -> rt.Device:
  device_history = doorbell.history(limit=limit)
  event_days: rt.DeviceHistoryByDate = {}
  for event_info in device_history:
    event = rt.Event(
        id=event_info['id'],
        created_at=event_info['created_at'],
        duration=event_info['duration'],
        type=event_info['kind'],
    )
    event_day = event.created_at.date()
    if event_day not in event_days:
      event_days[event_day] = []
    event_days[event_day].append(event)

  dates = event_days.keys()
  return rt.Device(
      id=doorbell.id,
      name=doorbell.name,
      history=event_days,
      date_range=rt.DateRange(
          start_date=min(dates),
          end_date=max(dates),
      ),
  )


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
