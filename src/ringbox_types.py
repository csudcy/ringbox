from datetime import date
from datetime import datetime
from typing import List, Mapping, Optional

from pydantic import BaseModel

# Not sure why, but pytype thinks BaseModel is a module (not a class).
# pytype: disable=base-class-error


class Event(BaseModel):
  id: str
  created_at: datetime
  duration: int
  type: str


DeviceHistoryByDate = Mapping[date, List[Event]]

EventCountByDate = Mapping[date, int]


class Device(BaseModel):
  id: str
  name: str
  history: DeviceHistoryByDate


class LocationDevices(BaseModel):
  name: str
  devices: List[Device]
  event_count_by_date: EventCountByDate
