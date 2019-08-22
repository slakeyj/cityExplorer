# cityExplorer
## City Explorer

# lab-08-back-end**Author**: Susanna Lakey
**Version**: 1.0.0 (increment the patch/fix version number if you make more commits past your first submission)

## Overview
This is backend for a frontend application designed to allow users to access weather for the location that is asked for. This backend accesses JSON data stored locally to be supplied to the frontend in a readable format

## Getting Started
### If you build from scratch, you will have to install the following packages: 
1. npm init -y
2. npm install -S express dotenv
3. npm install -S cors
4. npm install -S superagent (for working with APIs)

### If you copy the code down to your machine from my repo, simply:
1. type npm install (to install all packages needed)
2. Do a touch .env to create a file, then within that .env file add:
* add PORT=port_number
* Add an environment variable to your server named `EVENTBRITE_API_KEY `,
* Add an environment variable to your server named `WEATHER_API_KEY`, and use it appropriately in your code. 
* Add an environment variable to your server named `GEOCODE_API_KEY `, and use it appropriately in your code.

### Front End app exists here:
https://codefellows.github.io/code-301-guide/curriculum/city-explorer-app/front-end/

### To start server:
Type into terminal: <nodemon>, then, to restart at any time, enter `rs`

## Architecture
This application was designed with
* JavaScript
* API Calls 
<!-- Provide a detailed description of the application design. What technologies (languages, libraries, etc) you're using, and any other relevant design information. -->


## Change Log

08-20-2019 9:15am - Put together file structure.

08-20-2019 10:00am - Created object literal to pull data from geo.json

08-20-2019 10:15am - Made object literal into a constructor function and created a new instance of the location data which is appearing and the route is responding in the deployed static client.

08-20-2019 10:35am - Deployed to Heroku.

08-20-2019 1:50pm - Weather data time is now converted from milliseconds into a date.

08-21-2019 9:40am - File structure in place for new driver's computer

08-21-2019 10:20am - Completed code review of yesterday's code

08-21-2019 10:28am - Deployed to Heroku

08-21-2019 11:28am - locations functionality completed using API

08-21-2019 11:50am - Weather functionality completed using API

08-21-2019 4pm - Events functionality in place using API

08-22-2019 9:20am - Database Created

08-22-2019 9:45am - Google map data stored in SQL database table.

08-22-2019 10:50am - Dark Sky data stored in SQL database table.

08-22-2019 11:45am - Eventbrite data stored in SQL database table.





## Credits and Collaborations
* Peter Charmichaael

# Features
## Number and name of feature: Tuesday Lab

Estimate of time needed to complete: 4 hours

Start time: 9am

Finish time: 2pm, minus 1 hour, plus another 45 min

Actual time needed to complete: 4 hours 45 min

## Number and name of feature: Wednesday Feature - Adding API functionality

Estimate of time needed to complete: 3 hours

Start time: 9am

Finish time: 2pm, minus 1 hour, plus another 45 min

Actual time needed to complete: 4 hours 45 min
