from typing import List, Optional

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
import ringbox_types as rt

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
  # Check we're logged in
  services.get_ring()

  return templates.TemplateResponse('index.tpl', {
      'request': request,
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
    # Check if login worked
    services.get_ring(username=username, password=password, otp=otp)
  except exceptions.RingMissingOTPException:
    return templates.TemplateResponse(
        'login.tpl', {
            'request': request,
            'needs_otp': True,
            'username': username,
            'password': password,
        })
  else:
    return RedirectResponse('/', status_code=status.HTTP_302_FOUND)


####################
# API Routes
####################


@app.get('/devices/')
def devices_get() -> List[rt.LocationDevices]:
  """Get a list of devices by location.
  """
  return services.get_locations()


@app.get('/devices/history/')
def devices_history_get(device_ids: List[str] = Query(...),
                        limit: int = 1000) -> rt.DevicesHistory:
  """Get history for multiple devices.

  # Note: This is a POST so we can use Pydantic to parse the JSON body while
  # retaining nice docs - see https://github.com/tiangolo/fastapi/issues/884
  """
  devices = services.get_devices(device_ids)
  return services.get_devices_history(devices, limit)


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
