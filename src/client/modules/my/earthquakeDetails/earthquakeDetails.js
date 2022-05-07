/* eslint-disable @lwc/lwc/no-api-reassignments */
import { LightningElement, api } from 'lwc';
import mapboxgl from 'mapbox-gl';
const months_len_day = [31,28,31,30,31,30,31,31,30,31,30,31];
const COORD = {6: {lat: 37.372557, long: 140.849007}, 4:{lat: 32.092247, long: 130.829095}, 0: {lat: -21.816325, long: 114.16546}, 2: {lat: 21.420382, long: 158.153912}};
const stationMap = {6: 'JJY', 4: 'JJI', 0: 'NWC', 2: 'NPM'};
export default class EarthquakeDetails extends LightningElement {
    latMax = 53.090;
    longMax = 158.550;
    month_val = 7;
    day_val;
    year_val = 2019;
    longMin = COORD[4].long;
    latMin = COORD[4].lat;
    station_val = 4;
    prev_month_val = 7;
    prev_day_val;
    prev_year_val = 2019;
    prev_longMin = COORD[4].long;
    prev_latMin = COORD[4].lat;
    n_val = 3;
    prev_n_val = 3;
    from_date_val;
    to_date_val;
    prev_from_date_val;
    prev_to_date_val;
    @api
    get fromdate() {
        return this.from_date_val;
    }
    set fromdate(val) {
        this.setAttribute('from_date_val', val);
        this.prev_from_date_val= this.from_date_val;
        this.from_date_val = val;
        if (this.prev_from_date_val !== this.from_date_val) {
            this.handleValueChange();
        }
    }
    @api
    get todate() {
        return this.to_date_val;
    }
    set todate(val) {
        this.setAttribute('to_date_val', val);
        this.prev_to_date_val = this.to_date_val;
        this.to_date_val = val;
        if (this.prev_to_date_val !== this.to_date_val) {
           this.handleValueChange();
        }
    }
    @api 
    get month(){
        return this.month_val;
    }
    set month(val){
        this.setAttribute('month', val);
        this.prev_month_val = this.month_val;
        this.month_val = val;
        if(this.prev_month_val !== this.month_val){
            this.handleValueChange();
        }
    }
    @api 
    get n(){
        return this.n_val;
    }
    set n(val){
        this.setAttribute('n', val);
        this.prev_n_val = this.n_val;
        this.n_val = val;
        if(this.prev_n_val !== this.n_val){
            this.handleValueChange();
        }
    }
    @api 
    get year(){
        return this.year_val;
    }
    set year(val){
        this.setAttribute('year', val);
        this.prev_year_val = this.year_val;
        this.year_val = val;
        if(this.prev_year_val !== this.year_val){
            this.handleValueChange();
        }
    }
    @api 
    get day(){
        return this.day_val;
    }
    set day(val){
        this.setAttribute('day', val);
        this.prev_day_val = this.day_val;
        this.day_val = val;
        if(this.prev_day_val !== this.day_val){
            this.handleValueChange();
        }
    }
    @api 
    get station(){
        return this.station_val;
    }
    set station(val){
        this.setAttribute('station', val);
        this.station_val = val;
        this.prev_latMin = this.latMin;
        this.prev_longMin = this.longMin;
        this.latMin = COORD[val].lat;
        this.longMin = COORD[val].long;
        if(this.prev_latMin !== this.latMin || this.prev_longMin !== this.longMin){
            this.handleValueChange();
        }
    }
    dateFrom;
    dateTo;
    constructor() {
        super();
        const styles = document.createElement('link');
        styles.href = './resources/css/bootstrap.css';
        styles.rel = 'stylesheet';
        this.template.appendChild(styles);
    }
    map;
    async handleValueChange() {
        if (this.map.getLayer("earthquakes-viz")) {
            this.map.removeLayer("earthquakes-viz");
        }
        if(this.map.getLayer("earthquakes-prep")) {
            this.map.removeLayer("earthquakes-prep");
        }
        if (this.map.getSource("earthquakes")) {
            this.map.removeSource("earthquakes");
        }
        if (this.map.getLayer("outline")) {
            this.map.removeLayer("outline");
        }
        if (this.map.getLayer("maine_layer")) {
            this.map.removeLayer("maine_layer");
        }
        if (this.map.getSource("maine")) {
            this.map.removeSource("maine");
        }
        
        if(this.day){
            let startDate = new Date(this.year, this.month, this.day);
            startDate.setDate(startDate.getDate() + 1);
            let endDate = new Date(this.year, this.month, this.day);
            endDate.setDate(endDate.getDate() + 2);
            this.dateFrom = startDate.toISOString().split('T')[0];
            this.dateTo = endDate.toISOString().split('T')[0];
        }else if(this.from_date_val && this.to_date_val){
            let startDate = new Date(this.year, this.month, this.from_date_val);
            startDate.setDate(startDate.getDate() + 1);
            let endDate = new Date(this.year, this.month, this.to_date_val);
            endDate.setDate(endDate.getDate() + 2);
            this.dateFrom = startDate.toISOString().split('T')[0];
            this.dateTo = endDate.toISOString().split('T')[0];
        }else {
            this.dateFrom = new Date(this.year, this.month, 1).toISOString();
            this.dateTo = new Date(this.year, this.month, months_len_day[this.month]).toISOString();
        }
        let points = await fetch(`/api/point?station=${stationMap[this.station_val]}&n=${this.n_val}`).then(res => res.json()).catch(err => console.log(err));
        let query = '';
        if(this.dateFrom) {
            query += `&starttime=${this.dateFrom}`;
        } if(this.dateTo) {
            query += `&endtime=${this.dateTo}`;
        } if(this.latMin) {
            query += `&minlatitude=${this.latMin}`;
        } if(this.latMax) {
            query += `&maxlatitude=${this.latMax}`;
        } if(this.longMin) {
            query += `&minlongitude=${this.longMin}`;
        } if(this.longMax) {
            query += `&maxlongitude=${this.longMax}`;
        }

        if(this.map.getSource("maine")) {
            this.map.getSource('maine').setData({
                'type': 'Feature',
                'geometry': {
                'type': 'Polygon',
                // These coordinates outline Maine.
                'coordinates': [points]
                }
                });
        } else {
            this.map.addSource('maine', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Polygon',
                        'coordinates': [points]
                    }
                }
            });
        }
        if (!this.map.getLayer("maine_layer")) {

            this.map.addLayer({
                'id': 'maine_layer',
                'type': 'fill',
                'source': 'maine', // reference the data source
                'layout': {},
                'paint': {
                    'fill-color': '#0080ff', // blue color fill
                    'fill-opacity': 0.5
                }
            });
            // Add a black outline around the polygon.
        }
        if (!this.map.getLayer("outline")) {
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
        }

        if(this.map.getSource("earthquakes")) {
            this.map.getSource('earthquakes').setData(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&eventtype=earthquake${query}`);
        } else {
            this.map.addSource('earthquakes', {
                type: 'geojson',
                data: `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&eventtype=earthquake${query}`, // Use the sevenDaysAgo variable to only retrieve quakes from the past week
                generateId: true // This ensures that all features have unique IDs,
                
            });
        }
        if (!this.map.getLayer("earthquakes-viz")) {
            this.map.addLayer({
                id: 'earthquakes-viz',
                type: 'circle',
                source: 'earthquakes',
                paint: {
                    // The feature-state dependent circle-radius expression will render
                    // the radius size according to its magnitude when
                    // a feature's hover state is set to true
                    'circle-radius': [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        [
                            'interpolate',
                            ['linear'],
                            ['get', 'mag'],
                            1,
                            8,
                            1.5,
                            10,
                            2,
                            12,
                            2.5,
                            14,
                            3,
                            16,
                            3.5,
                            18,
                            4.5,
                            20,
                            6.5,
                            22,
                            8.5,
                            24,
                            10.5,
                            26
                        ],
                        5
                    ],
                    'circle-stroke-color': '#000',
                    'circle-stroke-width': 1,
                    // The feature-state dependent circle-color expression will render
                    // the color according to its magnitude when
                    // a feature's hover state is set to true
                    'circle-color': [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        [
                            'interpolate',
                            ['linear'],
                            ['get', 'mag'],
                            1,
                            '#fff7ec',
                            1.5,
                            '#fee8c8',
                            2,
                            '#fdd49e',
                            2.5,
                            '#fdbb84',
                            3,
                            '#fc8d59',
                            3.5,
                            '#ef6548',
                            4.5,
                            '#d7301f',
                            6.5,
                            '#b30000',
                            8.5,
                            '#7f0000',
                            10.5,
                            '#000'
                        ],
                        '#000'
                    ]
                }
            });
        }
        if (!this.map.getLayer("earthquakes-prep")) {
            this.map.addLayer({
                id: 'earthquakes-prep',
                type: 'circle',
                source: 'earthquakes',
                paint: {
                    'circle-radius': [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        [
                            'interpolate',
                            ['linear'],
                            ['get', 'mag'],
                            1,
                            this.calculatePreparationZone(1),
                            1.5,
                            this.calculatePreparationZone(1.5),
                            2,
                            this.calculatePreparationZone(2),
                            2.5,
                            this.calculatePreparationZone(2.5),
                            3,
                            this.calculatePreparationZone(3),
                            3.5,
                            this.calculatePreparationZone(3.5),
                            4.5,
                            this.calculatePreparationZone(4.5),
                            6.5,
                            this.calculatePreparationZone(6.5),
                            8.5,
                            this.calculatePreparationZone(8.5),
                            10.5,
                            this.calculatePreparationZone(10.5)
                        ],
                        5
                    ],
                    'circle-stroke-color': '#000',
                    'circle-stroke-width': 1,
                    "circle-opacity": [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        0, 1
                    ],
                    // The feature-state dependent circle-color expression will render
                    // the color according to its magnitude when
                    // a feature's hover state is set to true
                    'circle-color': [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        [
                            'interpolate',
                            ['linear'],
                            ['get', 'mag'],
                            1,
                            '#fff7ec',
                            1.5,
                            '#fee8c8',
                            2,
                            '#fdd49e',
                            2.5,
                            '#fdbb84',
                            3,
                            '#fc8d59',
                            3.5,
                            '#ef6548',
                            4.5,
                            '#d7301f',
                            6.5,
                            '#b30000',
                            8.5,
                            '#7f0000',
                            10.5,
                            '#000'
                        ],
                        '#000'
                    ]
                }
            });
        }
    }
    connectedCallback() {
        setTimeout(() => {
            mapboxgl.accessToken =
                'pk.eyJ1IjoibmFhdGthYTEzMiIsImEiOiJja3ZvZGRyeHQxaHI1MzNvdWRjeWtyZzZoIn0.5mMgqecofbh-BjDOTA10Ag';
            this.map = new mapboxgl.Map({
                container: this.template.querySelector('.map'),
                style: 'mapbox://styles/mapbox/streets-v11',
                zoom: 2.5,
                center: ['125.738052', '39.019444'],
            });
            // Add map controls
            this.map.addControl(new mapboxgl.NavigationControl());
            this.magDisplay = this.template.querySelector('.mag');
            this.locDisplay = this.template.querySelector('.loc');
            this.dateDisplay = this.template.querySelector('.date');
            this.map.on('load', () => {
                this.handleValueChange();
                let quakeID = null;

                this.map.on('click', 'earthquakes-viz', (event) => {
                    this.map.getCanvas().style.cursor = 'pointer';
                    const quakeDate = new Date(
                        event.features[0].properties.time
                    );
                    const selectedEvent = new CustomEvent('selecteddate', { detail: quakeDate });
                    this.dispatchEvent(selectedEvent);
                });

                this.map.on('mousemove', 'earthquakes-viz', (event) => {
                    this.map.getCanvas().style.cursor = 'pointer';
                    // Set variables equal to the current feature's magnitude, location, and time
                    const quakeMagnitude = event.features[0].properties.mag;
                    const quakeLocation = event.features[0].properties.place;
                    const quakeDate = new Date(
                        event.features[0].properties.time
                    );

                    if (event.features.length === 0) return;
                    // Display the magnitude, location, and time in the sidebar
                    this.magDisplay.textContent = quakeMagnitude;
                    this.locDisplay.textContent = quakeLocation;
                    this.dateDisplay.textContent = quakeDate;

                    // When the mouse moves over the earthquakes-viz layer, update the
                    // feature state for the feature under the mouse
                    if (quakeID) {
                        this.map.removeFeatureState({
                            source: 'earthquakes',
                            id: quakeID
                        });
                    }

                    quakeID = event.features[0].id;

                    this.map.setFeatureState(
                        {
                            source: 'earthquakes',
                            id: quakeID
                        },
                        {
                            hover: true
                        }
                    );
                });

                // When the mouse leaves the earthquakes-viz layer, update the
                // feature state of the previously hovered feature
                this.map.on('mouseleave', 'earthquakes-viz', () => {
                    if (quakeID) {
                        this.map.setFeatureState(
                            {
                                source: 'earthquakes',
                                id: quakeID
                            },
                            {
                                hover: false
                            }
                        );
                    }
                    quakeID = null;
                    // Remove the information from the previously hovered feature from the sidebar
                    this.magDisplay.textContent = '';
                    this.locDisplay.textContent = '';
                    this.dateDisplay.textContent = '';
                    // Reset the cursor style
                    this.map.getCanvas().style.cursor = '';
                });
            });
        }, 100);
    }

    calculatePreparationZone(magnitude){
        return 10**(0.43*magnitude);
    }

}