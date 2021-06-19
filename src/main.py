from typing import Dict, List, Optional

from fastapi import FastAPI
from fastapi import Form
from fastapi import Query
from fastapi import Request
from fastapi.responses import RedirectResponse
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette import status

import exceptions
import ringbox_types as rt
import services

app = FastAPI(title='Rinbox', version='0.0.1')
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

  return templates.TemplateResponse('watch.tpl', {
      'request': request,
  })


@app.get('/flush/')
def root_get() -> Response:
  services.clear_cache()

  return RedirectResponse('/', status_code=status.HTTP_302_FOUND)


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


@app.get('/api/devices/')
def devices_get() -> List[rt.LocationDevices]:
  """Get a list of devices by location.
  """
  return services.get_locations()


@app.get('/api/event/play/')
def event_play_get(event_ids: List[str] = Query(
    ...)) -> Dict[str, Optional[str]]:
  return {event_id: services.get_play_url(event_id) for event_id in event_ids}
