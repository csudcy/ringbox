from datetime import date
import functools
import json
import operator
from pathlib import Path
from typing import Dict, List, Optional

from oauthlib.oauth2 import MissingTokenError
from ring_doorbell import Auth
from ring_doorbell import Ring
from ring_doorbell import RingDoorBell

import exceptions
import ringbox_types as rt

RING_TOKEN_DESCRIPTION = 'Ringbox/1.0'
# TODO: Use a session cache for login tokens
RING_TOKEN_FILE = Path('ring_token.cache')

VIDEO_TYPES = ('stickup_cams', 'doorbots', 'authorized_doorbots')

EVENT_PLAY_URL = 'https://account.ring.com/api/clients_api/dings/{event_id}/share/play?disable_redirect=true'


def ring_token_updated(token):
  RING_TOKEN_FILE.write_text(json.dumps(token))


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
def get_device_lookup() -> Dict[str, RingDoorBell]:
  ring = get_ring()

  # Don't call update_data as that calls update_groups which fails if there are
  # no groups - and we only care about devices anyway...
  ring.update_devices()
  devices = ring.devices()

  device_lookup = {}
  for _type in VIDEO_TYPES:
    for device in devices[_type]:
      device_lookup[str(device.id)] = device

  return device_lookup


def get_locations() -> List[rt.LocationDevices]:
  device_lookup = get_device_lookup()

  devices_by_location: Dict[str, rt.LocationDevices] = {}
  for device in device_lookup.values():
    location = device.address.split(',')[0].strip()
    if location not in devices_by_location:
      devices_by_location[location] = rt.LocationDevices(name=location)
    devices_by_location[location].devices.append(
        rt.Device(id=device.id, name=device.name))

  location_list = list(
      sorted(devices_by_location.values(), key=operator.attrgetter('name')))
  for location in location_list:
    location.devices.sort(key=operator.attrgetter('name'))

  return location_list


def get_device(device_id: str) -> RingDoorBell:
  device_lookup = get_device_lookup()
  return device_lookup[device_id]


def get_devices(device_ids: List[str]) -> List[RingDoorBell]:
  device_lookup = get_device_lookup()
  return [device_lookup[device_id] for device_id in device_ids]


def get_devices_history(devices: List[rt.Device],
                        limit: int) -> rt.DevicesHistory:
  devices_history = [get_device_history(device, limit) for device in devices]
  return rt.DevicesHistory(
      devices=devices_history,
      date_range=rt.DateRange(
          start_date=min(device_history.date_range.start_date
                         for device_history in devices_history),
          end_date=max(device_history.date_range.end_date
                       for device_history in devices_history),
      ),
  )


def get_device_history(device: rt.Device, limit: int) -> rt.DeviceHistoryDevice:
  device_history = device.history(limit=limit)
  event_days: Dict[date, rt.DeviceHistoryDeviceDay] = {}
  for event_info in device_history:
    event = rt.Event(
        id=event_info['id'],
        created_at=event_info['created_at'],
        duration=event_info['duration'],
        type=event_info['kind'],
    )
    event_day = event.created_at.date()
    if event_day not in event_days:
      event_days[event_day] = rt.DeviceHistoryDeviceDay(
          day=event_day,
          events=[],
      )
    event_days[event_day].events.append(event)

  dates = event_days.keys()
  return rt.DeviceHistoryDevice(
      id=device.id,
      days=list(event_days.values()),
      date_range=rt.DateRange(
          start_date=min(dates),
          end_date=max(dates),
      ),
  )


def get_play_url(event_id: str) -> str:
  return event_id
