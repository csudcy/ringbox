import functools
import json
from pathlib import Path
from typing import Dict, List, Optional

from oauthlib.oauth2 import MissingTokenError
from ring_doorbell import Auth
from ring_doorbell import Ring
from ring_doorbell import RingDoorBell

import exceptions

RING_TOKEN_DESCRIPTION = 'Ringbox/1.0'
# TODO: Use a session cache for login tokens
RING_TOKEN_FILE = Path('ring_token.cache')

VIDEO_TYPES = ('stickup_cams', 'doorbots', 'authorized_doorbots')


def ring_token_updated(token):
    RING_TOKEN_FILE.write_text(json.dumps(token))


@functools.lru_cache
def get_ring(
    *,
    username: Optional[str] = None,
     password: Optional[str] = None,
    otp: Optional[str] = None
  ) -> Ring:
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


def get_device(device_id: str) -> RingDoorBell:
  device_lookup = get_device_lookup()
  return device_lookup[device_id]


def get_devices(device_ids: List[str]) -> List[RingDoorBell]:
  device_lookup = get_device_lookup()
  return [device_lookup[device_id] for device_id in device_ids]
