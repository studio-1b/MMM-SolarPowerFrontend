# MMM-SolarPowerFrontend
Widget which can be configured to read JSON, which you will have to create yourself, to show your solar power output

| 24h View                  | 30d view              | Annual Solar Summary
:-------------------------:|:-------------------------:|:-------------------------:
![](https://raw.githubusercontent.com/studio-1b/MMM-SolarPowerFrontend/main/docs/MMM-SolarPowerFrontend.Screenshot%20from%202024-03-18%2002-48-28.png)  |  ![](https://raw.githubusercontent.com/studio-1b/MMM-SolarPowerFrontend/main/docs/MMM-SolarPowerFrontend2.Screenshot%20from%202024-03-18%2002-49-19.png)  |  ![](https://raw.githubusercontent.com/studio-1b/MMM-SolarPowerFrontend/main/docs/MMM-SolarPowerFrontend3.Screenshot%20from%202024-03-18%2002-49-45.png)
 
This only graphs data.  It is only organized on frontend, to show the data organized for Solar Power Display

> [!WARNING]
> This MagicMirror module DOES NOT INTERFACE with any solar components.  It does not read battery charging characteristics.  It does not read Solar charging output.  Depending on your


# Options for obtaining data for Power meter

There are a variety of ways to do this, but as of 2024, none of them are a single click easy.  The two easiest resources below, are how to interface with a bluetooth interface to either a Battery, or Solar Controller.  A battery or solar controller with bluetooth is actually pretty common in 2024, for communicating with Smartphone apps.  There just needs to a hook for whatever platform will generate the data for this solar power display, if you like it.  Below are 2 programs for the python platform, running on Linux (I doubt it will work on Windows, as it doesn't look like there is a generic bluetooth interface for python), and you may need to modify the Python program for your purposes, to generate the data needed,

External link: Linux Python script for pulling JSON data from Renogy battery with bluetooth output
[ https://github.com/cyrils/renogy-bt]( https://github.com/cyrils/renogy-bt)

External link: Linux Python script for pulling JSON data from Victron Solar Controller with bluetooth output
[ https://github.com/keshavdv/victron-ble]( https://github.com/keshavdv/victron-ble)


The link below, is a project inspired by a powermeter project, featured in a Video by GreatScott on youtube. [https://www.youtube.com/watch?v=lrugreN2K4w](https://www.youtube.com/watch?v=lrugreN2K4w).  I took some liberties, and created a current and voltmeter that will read from two power supply pairs.

Arduino Nano IoT project, to read from Hall current sensors, and voltage dividers to read voltage
[ https://github.com/studio-1b/Solar-Power-Meter]( https://github.com/studio-1b/Solar-Power-Meter)

After you obtain the data, it can be uploaded to a URL.  Then change the configuration, to reflect the url location the data was uploaded.

## If you need to join json data

If you manage to get the Solar information in different json files, and you need to join them, I wrote a utility to help with that.
There is folder named Util.  Copy this python script:
```
jqoin.py
```

Give it permission to run
```
chmod +x jqoin.py
```

It is short.  It doesn't do anything evil.  You can look thru it yourself.  It is Python program, adapted to run a shell script.  It will create a database-like join between 2 json files, you just need to tell it, what the join values are
```
jqoin.py [folder/list of files1] [field from prev json] [folder/list of files2] [field from list of json]
```


# Installation
### Step 1: Git Clone and install dependencies(npm install)
```bash
    cd ~/MagicMirror/modules
    git clone https://github.com/studio-1b/MMM-SolarPowerFrontend.git
    cd MMM-SolarPowerFrontend
    npm install
```


### Step 2: Configure MagicMirror to display module

Add this entry to <MagicMirror root>/config/config.js, as entry in modules: [] array, somewhere at end.

```js
    {
        module: "MMM-SolarPowerFrontend",
        header: "Solar Power Meter",
        position: "top_right",
        config: {
            width: 350,
            contentAlign: 'right',

            mode: '24h', // 24h or 30d or 1yr
            power_24h_url: "***<url, data for 24h>***",
            power_30d_url: "***<url, data for 30d>***",
            power_1yr_url: "***<url, data for annual averages>***",
        }
    },
```

### Step 3: Make sure the data in the URL above, matches the data expected by this module

data expected in power_24h_url output
```js
[
  {
    "timestamp": "2024/03/07 00:40:30",
    "battery_ma": -1300,
    "est_available_mah": 70800,
    "system_mv": 13200.000000000002,
    "max_mah": 100000,
    "victron_now": "2024/03/07 00:40:24",
    "solar_mw": 0,
    "solar_ma": 0,
    "solar_mv": 0,
    "reported_mv": 13240
  },
  ... best results is total 144 records for 24h every 10min...
  {
    "timestamp": "2024/03/07 12:00:33",
    "battery_ma": 0,
    "est_available_mah": 62900,
    "system_mv": 13300,
    "max_mah": 100000,
    "victron_now": "2024/03/07 12:00:27",
    "solar_mw": 18000,
    "solar_ma": 1200,
    "solar_mv": 15000,
    "reported_mv": 13500
  }
]
```

data expected in power_30d_url output
```js
[
  {
    "timestamp": "2024/02/07 12:40:30",
    "battery_ma": -1300,
    "est_available_mah": 70800,
    "system_mv": 13200.000000000002,
    "max_mah": 100000,
    "victron_now": "2024/03/07 00:40:24",
    "solar_mw": 0,
    "solar_ma": 0,
    "solar_mv": 0,
    "reported_mv": 13240
  },
  ... best results is total 720 records for 30d every 1hr...
  {
    "timestamp": "2024/03/07 12:00:33",
    "battery_ma": 0,
    "est_available_mah": 62900,
    "system_mv": 13300,
    "max_mah": 100000,
    "victron_now": "2024/03/07 12:00:27",
    "solar_mw": 18000,
    "solar_ma": 1200,
    "solar_mv": 15000,
    "reported_mv": 13500
  }
]
```

data expected in power_1yr_url
```js
[
  {
    "mm": 1,
    "data": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0.03799283154121874,
      0.35770609318996505,
      0.6838709677419353,
      0.8753584229390681,
      1.0375448028673833,
      0.9435483870967768,
      0.5695340501792119,
      0.30788530465949787,
      0.04704301075268825,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ],
    "ah": 4.860483870967745,
    "wh": 4.516129032258065
  },
  ... Best results there is record for mm from 1 to 12, and data has 24 elements, each representing the average mA for that hour in that month ...
  {
    "mm": 12,
    "data": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0.08234767025089605,
      0.5624551971326155,
      0.8867383512544806,
      1.3939068100358443,
      1.6087813620071674,
      1.360304659498209,
      0.8195340501792113,
      0.2640681003584229,
      0.013261648745519687,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ],
    "ah": 6.991397849462366,
    "wh": 6.989247311827957
  }
]
```

### Step 4: Ensuring data is available

and verify the URL above in linux using the command
   curl <url>
or in any webrowser, enter the url


In addition to supplying the solar data, you have to find a way to send regular updates to the url.  The module will regularly check the url for changes, but you have to upload changes regularly.

   * power_24h_url
   * power_30d_url
   * power_1yr_url


If everything is in place, restart magic mirror to include the module on next restart.

