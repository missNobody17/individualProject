import { LightningElement } from 'lwc';

export default class App extends LightningElement {
    station = 4;
    month = 7;
    day = undefined;
    year = 2019;
    earthquakeDate;
    isDay;
    amp;
    phase;
    protons;
    electrons;
    constructor() {

        super();
        const styles = document.createElement('link');
        styles.href = './resources/css/bootstrap.css';
        styles.rel = 'stylesheet';
        this.template.appendChild(styles);
    }

    handleChartData(evt){
        this.month = evt.detail.month;
        this.year = evt.detail.year;
        this.station = evt.detail.station;
        this.day = evt.detail.day;
        this.isDay = evt.detail.day === 'day' ? true : false;
    }

    handleUserDate(evt){
        this.earthquakeDate = evt.detail;
    }

    handleVlf(evt) {
        this.amp = evt.detail.amp;
        this.phase = evt.detail.phase;
        this.protons = evt.detail.protons;
        this.electrons = evt.detail.electrons;
    }

}
