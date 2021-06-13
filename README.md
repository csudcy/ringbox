# ringbox

A server which allows you to view multiple Ring timelines at once.


# Setup

* Install:
  * `nvm`
  * `poetry`
  * `pyenv`
* Run:
```
pyenv install
nvm install

nvm use
npm run deps:install

# If you get issues with poetry not using wheels when it should, you can try:
poetry config experimental.new-installer false
npm run deps:install
```


# Run

```
nvm use
npm run serve
```


# Todo

* Proper session based login
* Proper caching
* Download videos locally to stream?
