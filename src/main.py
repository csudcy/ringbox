import operator
from typing import DefaultDict, List, Optional

from fastapi import FastAPI
from fastapi import Form
from fastapi import Query
from fastapi import Request
from fastapi.responses import Response
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette import status

import exceptions
import services

app = FastAPI()

app.mount('/static', StaticFiles(directory='static'), name='static')

templates = Jinja2Templates(directory='templates')

####################
# Template Routes
####################

@app.exception_handler(exceptions.RingMissingTokenException)
async def exception_handler() -> Response:
  return RedirectResponse(url='/login/')


@app.get('/')
def root_get(request: Request) -> Response:
  device_lookup = services.get_device_lookup()

  locations = DefaultDict(list)
  for device in device_lookup.values():
    location = device.address.split(',')[0].strip()
    locations[location].append(device)

  for location in locations:
    locations[location].sort(key=operator.itemgetter('name'))

  return templates.TemplateResponse('devices.tpl', {
      'request': request,
      'locations': locations,
  })


@app.get('/login/')
def login_get(request: Request) -> Response:
  return templates.TemplateResponse('login.tpl', {
      'request': request,
  })


@app.post('/login/')
def login_post(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    otp: Optional[str] = Form(None),
  ) -> Response:
  try:
    services.get_ring(username=username, password=password, otp=otp)
  except exceptions.RingMissingOTPException:
    return templates.TemplateResponse('login.tpl', {
        'request': request,
        'needs_otp': True,
        'username': username,
        'password': password,
    })
  else:
    return RedirectResponse('/', status_code=status.HTTP_302_FOUND)


@app.get('/watch/')
def login_get(request: Request, d: List[str] = Query(...)) -> Response:
  devices = services.get_devices(d)

  return templates.TemplateResponse('watch.tpl', {
      'request': request,
      'devices': devices,
  })

####################
# API Routes
####################

@app.get('/device/{device_id}/history/')
def device_id_history_get(device_id: str) -> Response:
  device = services.get_device(device_id)
  events = device.history(limit=5)

  return {
      'history': [
          {
              'created_at': event['created_at'],
              'duration': event['duration'],
              'id': event['id'],
          }
          for event in events
      ],
      'live_streaming_json': device.live_streaming_json,
  }


# @app.get('/device/{device_id}/event/{event_id}/')
# def device_id_history_get(device_id: str, event_id: str) -> Response:
#   device = services.get_device(device_id)
#   events = device.history(limit=5)

#   return {
#       'history': [
#           {
#               'created_at': event['created_at'],
#               'duration': event['duration'],
#               'id': event['id'],
#           }
#           for event in events
#       ],
#   }
