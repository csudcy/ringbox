from datetime import date
from datetime import datetime
from typing import List, Optional

import pydantic


class Event(pydantic.BaseModel):
  id: str
  created_at: datetime
  duration: int
  type: str


class DeviceHistoryDay(pydantic.BaseModel):
  events: List[Event]


class Device(pydantic.BaseModel):
  id: str
  name: str
  earliest_date: Optional[date]


class LocationDevices(pydantic.BaseModel):
  name: str
  devices: List[Device]


class LocationDevicesList(pydantic.BaseModel):
  locations: List[LocationDevices]
