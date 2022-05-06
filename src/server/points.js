/* eslint-disable guard-for-in */
const haversine = require('haversine-distance')
const ellipseToPolygon = require('ellipse-to-polygon');
//Distance calculation

//JJY, JJI, NWC, PTK
const COORD = {JJY: {lat: 37.372557, long: 140.849007}, JJI:{lat: 32.092247, long: 130.829095}, NWC: {lat: -21.816325, long: 114.16546}, NPM: {lat: 21.420382, long: 158.153912}, PTK: {lat: 53.090, long: 158.550}};
let wavelengths = {JJY: 40, JJI: 22.2, NWC: 19.8, NPM: 21.4} // JJY, JJI, NWC, NPM (KHz)

const fresnelzone = (n,d1,d2,lambda0,D) => {
    let fresnel = Math.sqrt((n*d1*d2*lambda0)/D) / 1000
    return fresnel;
}

//Function to calculate the wavelengths of the VLF signals
const wavelength = (wave) => {
    let VLF_lambda = (3*10**8) / (wave*10**3)
    return VLF_lambda
}

const toRadians = function(degrees) {   
	return degrees * Math.PI / 180;
}

// Convert from radians to degrees.
Math.toDegrees = function(radians) {
	return radians * 180 / Math.PI;
}

const midpoint = (lat1, long1, lat2, long2) => {
    let dLon = toRadians(long2 - long1);

    //convert to radians
    lat1 = toRadians(lat1);
    lat2 = toRadians(lat2);
    long1 = toRadians(long1);

    let Bx = Math.cos(lat2) * Math.cos(dLon);
    let By = Math.cos(lat2) * Math.sin(dLon);
    let lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By));
    let lon3 = long1 + Math.atan2(By, Math.cos(lat1) + Bx);

    //print out in degrees
    return [Math.toDegrees(lat3), Math.toDegrees(lon3)];
}

const GetEllipseAxisLengths = (p1_lat, p1_lng, p2_lat, p2_lng, station, n) => {
    let c2 = haversine({latitude: p1_lat, longitude: p1_lng}, {latitude: p2_lat, longitude: p2_lng});
    let a = c2 / 2.0;
    let b = fresnelzone(n, a, a, wavelength(wavelengths[station]), 2*a)*1000;
    return [a,b];
}

const GetEllipsePoints = (station, n) => {
    n = parseInt(n, 10);
    let [p1_lat, p1_lng] = [COORD.PTK.lat, COORD.PTK.long];
    let [p2_lat, p2_lng] = [COORD[station].lat, COORD[station].long];
    let center_lng = midpoint(p1_lat, p1_lng, p2_lat, p2_lng)[0];
    let center_lat = midpoint(p1_lat, p1_lng, p2_lat, p2_lng)[1];
    let dx = (p2_lat - p1_lat);
    let dy = (p2_lng - p1_lng);
    let anglefres =  Math.atan(dy/dx) * (180/Math.PI);
    let [a,b] = GetEllipseAxisLengths(p1_lat, p1_lng, p2_lat, p2_lng, station, n);
    let ellipse2 = station !== 'NWC' ? ellipseToPolygon([center_lat, center_lng], b , a, anglefres - 10) : ellipseToPolygon([center_lat, center_lng],b , a, anglefres - 2);
    //let ellipse2 =  ellipseToPolygon([center_lat, center_lng],b , a, anglefres - 50);
    let points = [];
    ellipse2.forEach(point => points.push([point[0], point[1]]));
    return points;
}
module.exports = {GetEllipsePoints};
