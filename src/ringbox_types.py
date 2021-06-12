from datetime import date, datetime
from typing import List

from pydantic import BaseModel


class Device(BaseModel):
  id: str
  name: str


class LocationDevices(BaseModel):
  name: str
  devices: Device = []


class Event(BaseModel):
  id: str
  created_at: datetime
  duration: int
  type: str


class DeviceHistory(BaseModel):
  id: str
  events: List[Event]


class DeviceHistoryDeviceDay(BaseModel):
  day: date
  events: List[Event]


class DateRange(BaseModel):
  start_date: date
  end_date: date


class DeviceHistoryDevice(BaseModel):
  id: str
  days: List[DeviceHistoryDeviceDay]
  date_range: DateRange


class DevicesHistory(BaseModel):
  devices: List[DeviceHistoryDevice]
  date_range: DateRange
