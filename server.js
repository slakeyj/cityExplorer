'use strict';

const express = require('express');
require('dotenv').config()
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT;

let weatherDailyArr = [];


//location constructor
function NewLocation(query, format, lat, lng) {
    this.search_query = query;
    this.formatted_query = format;
    this.latitude = lat;
    this.longitude = lng;

}

//weather constructor
function NewWeatherData(summary, date) {
    this.forecast = summary;
    this.time = date;
}

//Get location Data
app.get('/location', (req, res) => {
    try {
        const searchQuery = req.query.data;
        const dataFromGoogle = require('./data/geo.json');
        const formattedQuery = dataFromGoogle.results[0].formatted_address;
        const lat = dataFromGoogle.results[0].geometry.location.lat;
        const lng = dataFromGoogle.results[0].geometry.location.lng;

        const formattedData = new NewLocation(searchQuery, formattedQuery, lat, lng);

        res.send(formattedData);

    } catch (error) {
        console.error(error);
    }
})

//Get Weather Data
// weather information
app.get('/weather', (request, response) => {
    try {

        const weatherData = require('./data/darksky.json');

        // the search query comes from the front end
        // const searchQuery = request.query.data;

        // the below come from darksky json

        for (let i = 0; i < weatherData.daily.data.length; i++) {
            let forecast = weatherData.daily.data[i].summary;
            let time = weatherData.daily.data[i].time * 1000;
            var unixTime = new Date(time)
            let weatherDaily = new NewWeatherData(forecast, unixTime);
            weatherDailyArr.push(weatherDaily);
        }

        response.send(weatherDailyArr);
        // console.log(weatherData);

    } catch (error) {
        console.error(error);
        response.send(error.message);
    }
})

app.listen(PORT, () => {
    console.log(`app is running on ${PORT}`);
});