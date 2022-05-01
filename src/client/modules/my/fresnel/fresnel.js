/* eslint-disable vars-on-top */
import { LightningElement} from 'lwc';
import mapboxgl from 'mapbox-gl';
export default class EarthquakeDetails extends LightningElement {
    r = 6371
    //JJY, JJI, NWC, PTK
    longitudes = [140.849007, 130.829095, 114.16546, 158.550]
    latitudes = [37.372557, 32.092247, -21.816325, 53.090] 
    distances = {JJY: 2218000, JJI: 3217000, NWC: 9361000};
    midpoints = {JJY: [148.27, 45.34], JJI: [142.16, 43.24], NWC: [131.21, 16.45]};
    angles = {JJY: 57.96700775434482, JJI: 48.75270435241114, NWC: 65.20842965116731};
    fresnels = {JJY: 111694.894333439, JJI: 180569.24428759663, NWC: 326151.8133558707};
    wavelengths = [40, 22.2, 19.8] //JJY, JJI, NWC (KHz)
    constructor() {
        super();
        const styles = document.createElement('link');
        styles.href = './resources/css/bootstrap.css';
        styles.rel = 'stylesheet';
        this.template.appendChild(styles);

        const styles2 = document.createElement('link');
        styles.href = 'https://api.mapbox.com/mapbox-gl-js/v1.3.0/mapbox-gl.css';
        styles.rel = 'stylesheet';
        this.template.appendChild(styles2);
    }
    map;
    async connectedCallback() {
        let points = await fetch(`/point?station=NWC`).then(res => res.json()).catch(err => console.log(err));
        //console.log(points);
        setTimeout(() => {

            //var ellipses = [[1000000,500000,50,70,45],[100000,500000,-50,70],[1000000,3000000],[3000000,1000000,-100,-20],[1000000,3000000,100,-20,15]]
            //var geojson = this.createEllipse(this.distances.JJY/2, this.fresnels.JJY, this.midpoints.JJY[0], this.midpoints.JJY[1] , this.angles.JJY);
            mapboxgl.accessToken =
                'pk.eyJ1IjoibmFhdGthYTEzMiIsImEiOiJja3ZvZGRyeHQxaHI1MzNvdWRjeWtyZzZoIn0.5mMgqecofbh-BjDOTA10Ag';
            this.map = new mapboxgl.Map({
                container: this.template.querySelector('.map'),
                style: 'mapbox://styles/mapbox/streets-v11',
                //zoom: 2.5,
                center: ['125.738052', '39.019444'],
            });
            
            this.map.on('load', () => {
                // Add a data source containing GeoJSON data.
                this.map.addSource('maine', {
                'type': 'geojson',
                'data': {
                'type': 'Feature',
                'geometry': {
                'type': 'Polygon',
                // These coordinates outline Maine.
                'coordinates': [points]
                }
                }
                });
                 
                // Add a new layer to visualize the polygon.
                this.map.addLayer({
                'id': 'maine',
                'type': 'fill',
                'source': 'maine', // reference the data source
                'layout': {},
                'paint': {
                'fill-color': '#0080ff', // blue color fill
                'fill-opacity': 0.5
                }
                });
                // Add a black outline around the polygon.
                this.map.addLayer({
                'id': 'outline',
                'type': 'line',
                'source': 'maine',
                'layout': {},
                'paint': {
                'line-color': '#000',
                'line-width': 3
                }
                });
                });
                new mapboxgl.Marker({offset: [0, -50/2]}).setLngLat([this.longitudes[2], this.latitudes[2]]).addTo(this.map);
                new mapboxgl.Marker({offset: [0, -50/2]}).setLngLat([this.longitudes[3], this.latitudes[3]]).addTo(this.map);
        }, 100);
    }

    createEllipse(a,b,x,y,rotation) {
        if(typeof rotation == 'undefined') { rotation = 0; }
        if(typeof x == 'undefined') { x = 0; }
        if(typeof y == 'undefined') { y = 0; }
        
        var k = Math.ceil(36 * (Math.max(a/b,b/a))); // sample angles
        var coords = [];
        
        for (var i = 0; i <= k; i++) {
        
            // get the current angle
            var angle = Math.PI*2 / k * i + rotation
            
            // get the radius at that angle
            var r = a * b / Math.sqrt(a*a*Math.sin(angle)*Math.sin(angle) + b*b*Math.cos(angle)*Math.cos(angle));
    
            coords.push(this.getLatLong([x,y],angle,r));
        }
        return { "type":"Polygon", "coordinates":[coords] };
    }
    
     
    getLatLong(center,angle,radius) {
        
        var rEarth = 6371000; // meters
        
        let x0 = center[0] * Math.PI / 180; // convert to radians.
        let y0 = center[1] * Math.PI / 180;
        
        var y1 = Math.asin( Math.sin(y0)*Math.cos(radius/rEarth) + Math.cos(y0)*Math.sin(radius/rEarth)*Math.cos(angle) );
        var x1 = x0 + Math.atan2(Math.sin(angle)*Math.sin(radius/rEarth)*Math.cos(y0), Math.cos(radius/rEarth)-Math.sin(y0)*Math.sin(y1));
        
        y1 = y1 * 180 / Math.PI;
        x1 = x1	* 180 / Math.PI;
                
        return [x1,y1];
    }


    //Function to calculate the nth Fresnel zone
    fresnelzone(n,d1,d2,lambda0,D){
        let fresnelzone = Math.sqrt((n*d1*d2*lambda0)/D) / 1000
        return fresnelzone
    } 

    // Function to calculate the wavelengths of the VLF signals
    wavelength(wavelengths){
        let VLF_lambda = (3*10**8) / (wavelengths*10**3)
        return VLF_lambda
    }
    
}