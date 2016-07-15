# grovepi-dashboard

* Install nodejs in the Pi
* Clone this repo in Pi. Copy `assets` folder to your local computer.
* Run server
```bash
$ node grovepi_ws.js
```
* In your local computer, open `dashboard.htm` file with a browser, using the `wsserver` parameter pointing to your Pi and port 8888
```
file:///dashboard.htm?wsserver=<RPi IP>:8888
```
