from datetime import date
from datetime import datetime
from typing import List, Mapping, Optional

from pydantic import BaseModel

# Not sure why, but pytype thinks BaseModel is a module (not a class).
# pytype: disable=base-class-error


class DateRange(BaseModel):
  start_date: date
  end_date: date


class Event(BaseModel):
  id: str
  created_at: datetime
  duration: int
  type: str


DeviceHistoryByDate = Mapping[date, List[Event]]


class Device(BaseModel):
  id: str
  name: str
  history: DeviceHistoryByDate
  date_range: DateRange


class LocationDevices(BaseModel):
  name: str
  devices: List[Device]
  date_range: DateRange
