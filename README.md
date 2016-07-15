# grovepi-dashboard

1. Install nodejs in the Pi
2. Clone this repo in Pi. Copy `assets` folder to your local computer.
3. Run server```bash
$ node grovepi_ws.js
```
4. In your local computer, open `dashboard.htm` file with a browser, using the `wsserver` parameter pointing to your Pi and port 8888
```
file:///dashboard.htm?wsserver=<RPi IP>:8888
```
