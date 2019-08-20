'use strict';

const express = require('express');
require('dotenv').config()
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT;

app.get('/location', (req, res) => {
    try {

        const dataFromGoogle = require('./data/geo.json');
        const searchQuery = req.query.data;
        const formattedQuery = dataFromGoogle.results[0].formatted_address;
        const lat = dataFromGoogle.results[0].geometry.location.lat;
        const lng = dataFromGoogle.results[0].geometry.location.lng;

        const formattedData = {
            search_query: searchQuery,
            formatted_query: formattedQuery,
            latitude: lat,
            longitude: lng,
        };
        res.send(formattedData);

    } catch (error) {
        // console.log()
        console.error(error);
    }
})

app.listen(PORT, () => {
    console.log(`app is running on ${PORT}`);
});