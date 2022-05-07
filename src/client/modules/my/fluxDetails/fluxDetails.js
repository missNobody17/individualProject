/* eslint-disable no-alert */
/* eslint-disable no-extra-boolean-cast */
import { LightningElement, track, api} from 'lwc';
import Highcharts from 'highcharts';
import {getElectrons, getProtons} from './ftpAccess';

export default class FluxDetails extends LightningElement {
    @track chart;
    @track chart2;
    month_val = 7;
    @api station;
    is_clicked_val;
    day_val;
    day_from_val;
    day_to_val;
    year_val = 2019;
    prev_month_val = 7;
    prev_day_val;
    prev_day_from_val;
    prev_day_to_val;
    prev_year_val = 2019;
    is_day_val = true;
    prev_is_day_val = true;
    loading = true;
    electrons = [];
    protons = [];
    earthquake_val;
    prev_earthquake_val;
    electronsDay = [];
    protonsDay = [];
    dayLengths = [];
    @api
    get earthquake() {
        return this.earthquake_val;
    }
    set earthquake(val) {
        this.setAttribute('earthquake_val', val);
        this.prev_earthquake_val = this.earthquake_val;
        this.earthquake_val = val;
        if (this.prev_earthquake_val !== this.earthquake_val) {
            this.handleEarthquake();
        }
    }
    @api
    get isclicked() {
        return this.is_clicked_val;
    }
    set isclicked(val) {
        this.setAttribute('is_clicked_val', val);
        this.is_clicked_val = val;
        if (this.is_clicked_val) {
            this.handleChange();
        }
    }
    @api
    get month() {
        return this.month_val;
    }
    set month(val) {
        this.setAttribute('month', val);
        this.prev_month_val = this.month_val;
        this.month_val = val;
        /*if (this.prev_month_val !== this.month_val) {
            this.handleChange();
        }*/
    }
    @api
    get year() {
        return this.year_val;
    }
    set year(val) {
        this.setAttribute('year', val);
        this.prev_year_val = this.year_val;
        this.year_val = val;
        /*if (this.prev_year_val !== this.year_val) {
            this.handleChange();
        }*/
    }
    @api
    get day() {
        return this.day_val;
    }
    set day(val) {
        this.setAttribute('day', val);
        this.prev_day_val = this.day_val;
        this.day_val = val;
        /*if (this.prev_day_val !== this.day_val) {
            this.handleChange(this.day_val);
        }*/
    }
    @api
    get dayto() {
        return this.day_to_val;
    }
    set dayto(val) {
        this.setAttribute('dayto', val);
        this.prev_day_to_val = this.day_to_val;
        this.day_to_val = val;
        /*if (this.prev_day_to_val !== this.day_to_val) {
            this.handleChange(this.day_to_val);
        }*/
    }
    @api
    get dayfrom() {
        return this.day_from_val;
    }
    set dayfrom(val) {
        this.setAttribute('dayfrom', val);
        this.prev_day_from_val = this.day_from_val;
        this.day_from_val = val;
        /*if (this.prev_day_from_val !== this.day_from_val) {
            this.handleChange(this.day_from_val);
        }*/
    }
    @api
    get isday() {
        return this.id_day_val;
    }
    set isday(val) {
        this.setAttribute('isday', val);
        this.prev_id_day_val = this.is_day_val;
        this.is_day_val = val;
        /*if (this.prev_is_day_val !== this.is_day_val) {
            this.handleChange();
        }*/
    }
    constructor() {
        super();
        const styles = document.createElement('link');
        styles.href = './resources/css/bootstrap.css';
        styles.rel = 'stylesheet';
        this.template.appendChild(styles);
    }

    async connectedCallback() {
        /*const [data, dLengths] = await fetch(
            `/electrons?month=${this.month}&year=${this.year}&day=${this.day_val}&isDay=${this.is_day_val}&station=${this.station}&dayFrom=${this.day_from_val}&dayTo=${this.day_to_val}`
        )
            .then(function (response) {
                return response.json();
            })
            .catch((err) => console.log(err));
        const data2 = await fetch(
            `/protons?month=${this.month}&year=${this.year}&day=${this.day_val}&isDay=${this.is_day_val}&station=${this.station}&dayFrom=${this.day_from_val}&dayTo=${this.day_to_val}`
        )
            .then(function (response) {
                return response.json();
            })
            .catch((err) => console.log(err));*/
        const [data, dLengths] = getElectrons(this.month, this.year, this.day_val, this.is_day_val, this.station, this.day_from_val, this.day_to_val);
        const data2 = getProtons(this.month, this.year, this.day_val, this.is_day_val, this.station, this.day_from_val, this.day_to_val);
        setTimeout(() => {
            this.electrons = [...data];
            this.protons = [...data2];
            this.dayLengths = [...dLengths];
            this.chart = Highcharts.chart(
                this.template.querySelector('.myChart'),
                {
                    colors: ['#FC8BB8', '#FCF397'],

                    chart: {
                        zoomType: 'x'
                    },

                    title: {
                        text: 'Electron Flux'
                    },

                    xAxis: {
                        tickInterval: 288
                    },

                    series: [
                        {
                            name: 'Electron flux',
                            data: this.electrons
                        },
                        {
                            type: 'scatter',
                            name: 'Eartquake point',
                            data: [],
                            marker: {
                                symbol: 'url(https://www.highcharts.com/samples/graphics/earth.svg)',
                                width: 20,
                                height: 20
                            }
                        }
                    ]
                }
            );
            this.chart2 = Highcharts.chart(
                this.template.querySelector('.myChart2'),
                {
                    colors: ['#FC8BB8', '#FCF397'],

                    chart: {
                        zoomType: 'x'
                    },

                    title: {
                        text: 'Proton Flux'
                    },

                    xAxis: {
                        tickInterval: 288
                    },

                    series: [
                        {
                            name: 'Proton flux',
                            data: this.protons
                        },
                        {
                            type: 'scatter',
                            name: 'Eartquake point',
                            data: [],
                            marker: {
                                symbol: 'url(https://www.highcharts.com/samples/graphics/earth.svg)',
                                width: 20,
                                height: 20
                            }
                        }
                    ]
                }
            );
            this.loading = false;
            this.sendFlux();
        }, 100);
    }
    handleDataChange() {
        this.sendFlux();
        this.setData(this.electrons, this.protons);
    }

    calculateIndex(index) {
      let sum = 0;
      for (let i = 0; i < index; i++) {
          sum += this.dayLengths[i];
      }
      return sum;
  }

    handleEarthquake() {
        if (this.is_day_val !== 'night') {
            let index = Boolean(this.day_val) ? (this.earthquake_val.getHours() - 2) * 12 : ((Boolean(this.day_from_val) && Boolean(this.day_to_val)) ? (this.earthquake_val.getDate() - this.day_from_val) * 288 : (this.earthquake_val.getDate()) * 288);
            this.chart.series[1].setData([{ x: index, y: this.electrons[index] }]);
            this.chart2.series[1].setData([{ x: index, y: this.protons[index] }]);
        } else if (this.is_day_val === 'night' && this.dayLengths.length > 0) {
            let index;
            if (!Boolean(this.day_val)) {
                if(this.day_from_val && this.day_to_val){
                    index = this.calculateIndex(this.earthquake_val.getDate() - this.day_from_val);
                }else {
                    index = this.calculateIndex(this.earthquake_val.getDate());
                }
            } else if (this.earthquake_val.getHours() - 1 <  this.dayLengths[0]) {
                index = this.earthquake_val.getHours() - 1 === 0 ? 0 : (this.earthquake_val.getHours() - 2) * 12;
            } else if (this.earthquake_val.getHours() - 1 > this.dayLengths[1]) {
                index = (this.dayLengths[0] + this.dayLengths[1] - this.earthquake_val.getHours() - 2) *12;
            } else {
                alert('Earthquake hour after twilight hours');
                return;
            }
            this.chart.series[1].setData([{ x: index, y: this.electrons[index] }]);
            this.chart2.series[1].setData([{ x: index, y: this.protons[index] }]);
        }
    }

    async handleChange() {
        this.loading = true;
        console.log(`/electrons?month=${this.month}&year=${this.year}&day=${this.day_val}&isDay=${this.is_day_val}&station=${this.station}&dayFrom=${this.day_from_val}&dayTo=${this.day_to_val}`);
        let [data, dLen] = await fetch(
            `/electrons?month=${this.month}&year=${this.year}&day=${this.day_val}&isDay=${this.is_day_val}&station=${this.station}&dayFrom=${this.day_from_val}&dayTo=${this.day_to_val}`
        )
            .then(function (response) {
                return response.json();
            })
            .catch((err) => console.log(err));
        let data2 = await fetch(
            `/protons?month=${this.month}&year=${this.year}&day=${this.day_val}&isDay=${this.is_day_val}&station=${this.station}&dayFrom=${this.day_from_val}&dayTo=${this.day_to_val}`
        )
            .then(function (response) {
                return response.json();
            })
            .catch((err) => console.log(err));
        this.electrons = [...data];
        this.protons = [...data2];
        this.dayLengths = dLen;
        this.handleDataChange();
    }

    setData(data, data2) {
        try {
            this.chart?.series[0]?.setData(data);
            this.chart2?.series[0]?.setData(data2);
            this.chart?.series[1]?.setData([]);
            this.chart2?.series[1]?.setData([]);
            if (Boolean(this.day_val) && this.chart.xAxis[0] && this.chart2.xAxis[0]) {
                this.chart.xAxis[0].options.tickInterval = 12;
                this.chart2.xAxis[0].options.tickInterval = 12;
            }
            this.loading = false;
        } catch (e) {
            console.log(e);
        }
    }

    sendFlux() {
        this.is_clicked_val = false;
        const selectedEvent = new CustomEvent('sendflux', {
            detail: { protons: this.protons, electrons: this.electrons, isclicked: false }
        });
        this.dispatchEvent(selectedEvent);
    }
}