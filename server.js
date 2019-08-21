'use strict';

const express = require('express');
const cors = require('cors');
//superagent talks to the internet over http
const superagent = require('superagent');
require('dotenv').config()

const app = express();
app.use(cors());

const PORT = process.env.PORT;

function Location(query, format, lat, lng) {
    this.search_query = query;
    this.formatted_query = format;
    this.latitude = lat;
    this.longitude = lng;
}

app.get('/location', (request, response) => {
    const query = request.query.data; //seattle

    const urlToVisit = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=AIzaSyBt-Y_4KtCaKJtFOMkhzegnVxwVy4KrNic`;

    // superagent.get('url as a string');
    superagent.get(urlToVisit).then(responseFromSuper => {
            // console.log('stuff', responseFromSuper.body);

            // I simply replaced my geodata require, with the data in the body of my superagent response
            const geoData = responseFromSuper.body;

            const specificGeoData = geoData.results[0];

            const formatted = specificGeoData.formatted_address;
            const lat = specificGeoData.geometry.location.lat;
            const lng = specificGeoData.geometry.location.lng;

            const newLocation = new Location(query, formatted, lat, lng)
            response.send(newLocation);
        }).catch(error => {
            response.status(500).send(error.message);
            console.error(error);
        })
        // console.log('thingsfrominternets', thingFromInternet);
})


function Day(summary, time) {
    this.forecast = summary;
    this.time = new Date(time * 1000).toDateString();
}

app.get('/weather', (request, response) => {
    // console.log(request);

    let localData = request.query.data;

    const darkSkyUrl = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${localData.latitude},${localData.longitude}`;

    // console.log(darkSkyUrl);

    superagent.get(darkSkyUrl).then(responseFromSuper => {
        // console.log('Location Body', responseFromSuper.body);

        const weatherBody = responseFromSuper.body;

        const eightDays = weatherBody.daily.data;
        // console.log('DAILY DATA', eightDays);

        const formattedDays = eightDays.map(
            day => new Day(day.summary, day.time)
        );

        response.send(formattedDays)
    })
})

//constructor function for eventbrite
function Events(link, name, date, summary) {
    this.link = link;
    this.name = name;
    this.event_date = new Date(date).toDateString();
    this.summary = summary;
}
// set up an app.get for /eventbrite
app.get('/events', (request, response) => {
    let eventData = request.query.data;

    const eventUrlData =
        `https://www.eventbriteapi.com/v3/events/search/?sort_by=date&location.latitude=${eventData.latitude}&location.longitude=${eventData.longitude}&token=ZDDD2HU3AK5DLAZ6IYF5`


    superagent.get(eventUrlData).then(responseFromSuper => {
        // console.log('stuff', responseFromSuper.body.events);

        const eventBody = responseFromSuper.body.events;

        const dailyEvents = eventBody.map(day => new Events(day.url, day.name.text, day.start.local, day.description.text));

        response.send(dailyEvents);
    })
})
app.listen(PORT, () => { console.log(`app is up on PORT ${PORT}`) });