# MMM-SolarPowerFrontend
Widget which can be configured to read JSON, which you will have to create yourself, to show your solar power output

| Basic View               | 24h View                  | 30d view              | Annual Solar Summary
:-------------------------:|:-------------------------:|:-------------------------:|:----------------:
![](https://raw.githubusercontent.com/studio-1b/MMM-GraphImapChaseAlert/main/docs/MMM-GraphImapChaseAlert.Screenshot%20from%202024-02-25%2005-31-32.png)  |  ![](https://raw.githubusercontent.com/studio-1b/MMM-GraphImapChaseAlert/main/docs/MMM-GraphImapChaseAlert.projection%20Screenshot%20from%202024-02-25%2005-33-01.png)

This only graphs data.  It is only organized on frontend, to show the data organized for Solar Power Display

> [!WARNING]
> This MagicMirror module DOES NOT INTERFACE with any solar components.  It does not read battery charging characteristics.  It does not read Solar charging output.  Depending on your


# Options for obtaining data for Power meter

Linux Python script for pulling JSON data from Renogy battery with bluetooth output
[ https://github.com/studio-1b/]( https://github.com/studio-1b/)

Linux Python script for pulling JSON data from Victron Solar Controller with bluetooth output
[ https://github.com/studio-1b/]( https://github.com/studio-1b/)

Arduino Nano IoT project, to read from Hall current sensors, and voltage dividers to read voltage
[ https://github.com/studio-1b/]( https://github.com/studio-1b/)


# Installation
### Step 1: Git Clone and install dependencies(npm install)
```bash
    cd ~/MagicMirror/modules
    git clone https://github.com/studio-1b/MMM-SolarPowerFrontend.git
    cd MMM-SolarPowerFrontend
    npm install
```


### Step 2: Configure MagicMirror to display module

Add this entry to <MagicMirror root>/config/config.js, as entry in *modules: [* array, somewhere at end.

```js
    {
        module: "MMM-SolarPowerFrontend",
        header: "Solar Power Meter",
        position: "top_right",
        config: {
            width: 350,
            contentAlign: 'right',

            mode: '24h|30d|1y',
            power_24h_url: "***<data for 24h>***",
            power_30d_url: "***<data for 30d>***",
            power_1yr_url: "***<data for annual averages>***",
        }
    },
```

### Step 3: 

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

You have to find a way to update the url in  
   power_24h_url
   power_30d_url
   power_1yr_url

and verify in linux using the command
   curl <url>
or in any webrowser, enter the url

if there, restart magic mirror

