"""Example service api_exceptions"""
from http import client

from fastapi import HTTPException


class RingboxHttpException(HTTPException):

  def __init__(self):
    return super().__init__(status_code=self.STATUS_CODE, detail=self.DETAIL)


class RingMissingTokenException(RingboxHttpException):
  """There is no cached token (so you need to login)."""
  STATUS_CODE = client.FORBIDDEN
  DETAIL = "Missing token; please login."


class RingMissingOTPException(RingboxHttpException):
  """Ring requires an OTP to be provided."""
  STATUS_CODE = client.UNAUTHORIZED
  DETAIL = "Missing OTP."
