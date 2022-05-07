/* eslint-disable no-unused-vars */
// Simple Express server setup to serve for local testing/dev API server
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const f = require('./points');
const vlf = require('./vlfdata');
const ftp = require('./ftpAccess');
const stat = require('./calculateCorr');
const path = require('path');

const app = express();
app.use(helmet());
app.use(compression());

const HOST = process.env.API_HOST || 'localhost';
const PORT = process.env.API_PORT || 3002;

app.get('/vlfRaw', async (req, res) => {
    const [vlf_amp, vlf_phase, countDays, dayLengths] = await vlf.rawData(req.query.month, req.query.year , req.query.amp, req.query.phase, req.query.isDay, req.query.whichDay, req.query.dayFrom, req.query.dayTo);
    return res.send([vlf_amp, vlf_phase, countDays, dayLengths]);
});
app.get('/vlfAvg', async (req, res) => {
    const [vlf_amp, vlf_phase] = await vlf.difference(req.query.month, req.query.year, req.query.amp, req.query.phase, req.query.isDay, req.query.whichDay, req.query.dayFrom, req.query.dayTo);
    return res.send([vlf_amp, vlf_phase]);
});

app.get('/vlfEarth', async (req, res) => {
    const [vlf_amp, vlf_phase, dayLengths] = await vlf.weekBeforeAfter(req.query.month, req.query.year , req.query.amp, req.query.phase, req.query.isDay, req.query.whichDay);
    return res.send([vlf_amp, vlf_phase, dayLengths]);
});

app.get('/electrons', async (req, res) => {
    const [electrons, dayLengths] = await ftp.getElectrons(req.query.month, req.query.year, req.query.day, req.query.isDay, req.query.station, req.query.dayFrom, req.query.dayTo);
    return res.send([electrons, dayLengths]);
});

app.get('/protons', async (req, res) => {
    const protons = await ftp.getProtons(req.query.month, req.query.year, req.query.day, req.query.isDay, req.query.station, req.query.dayFrom, req.query.dayTo);
    return res.send(protons);
});

app.get('/api/point', (req, res) => {
    return res.send(f.GetEllipsePoints(req.query.station, req.query.n));
});

app.get('/stats', async (req, res) => {
    const data = await stat.init(req.query.month, req.query.year, req.query.day, req.query.isDay, req.query.station, req.query.dayFrom, req.query.dayTo);
    return res.send(data);
});

app.get('/api/v1/endpoint', (req, res) => {
    res.json({ success: true });
});

app.listen(PORT, () =>
    console.log(
        `✅  API Server started: http://${HOST}:${PORT}/api/v1/endpoint`
    )
);
