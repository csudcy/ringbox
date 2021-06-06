"""App and route declarations"""
from fastapi import FastAPI

import exceptions

app = FastAPI()


@app.get('/')
def root_get():
  return {'Hello': 'World'}


@app.get('/error')
def error_get():
  raise exceptions.ExampleException()
