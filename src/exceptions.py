"""Example service api_exceptions"""
from http import client

from fastapi import HTTPException


class RingboxHttpException(HTTPException):

  def __init__(self):
    return super().__init__(status_code=self.STATUS_CODE, detail=self.DETAIL)


class ExampleException(RingboxHttpException):
  """Example exception showing how FastAPI handles errors"""
  STATUS_CODE = client.CONFLICT
  DETAIL = "This is an example error."
