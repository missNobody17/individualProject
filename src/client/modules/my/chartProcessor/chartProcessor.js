/* eslint-disable no-alert */
/* eslint-disable no-extra-boolean-cast */
/* eslint-disable no-await-in-loop */
import { LightningElement, api } from 'lwc';
import Highcharts from 'highcharts';

export default class ChartProcessor extends LightningElement {
    chart;
    chart2;
    chart3;
    chart4;
    chart5;
    chart6;
    @api eartquakeDate;
    corr = {
        ea: 0,
        pa: 0,
        ep: 0,
        pp: 0,
    };
    protons;
    electrons;
    vlf_amp = [];
    vlf_amp_avg = [];
    vlf_phase = [];
    vlf_phase_avg = [];
    dayLengths = [];
    amp = 4;
    phase = 5;
    month = 7;
    whichDay = undefined;
    year = 2019;
    loading = true;
    partOfDay = 'day';
    day = false;
    earthquakeView = false;
    months_len_day = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    month_len;
    months = [
        { label: 'JAN', val: 0 },
        { label: 'FEB', val: 1 },
        { label: 'MAR', val: 2 },
        { label: 'APR', val: 3 },
        { label: 'MAY', val: 4 },
        { label: 'JUN', val: 5 },
        { label: 'JUL', val: 6 },
        { label: 'AUG', val: 7 },
        { label: 'SEP', val: 8 },
        { label: 'OCT', val: 9 },
        { label: 'NOV', val: 10 },
        { label: 'DEC', val: 11 }
    ];
    years = [
        2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019
    ];

    earthquake_date_val;
    prev_earthquake_date_val;
    @api
    get eartquake() {
        return this.earthquake_date_val;
    }
    set eartquake(val) {
        this.setAttribute('earthquake_date_val', val);
        this.prev_earthquake_date_val = this.earthquake_date_val;
        this.earthquake_date_val = val;
        if (this.prev_earthquake_date_val !== this.earthquake_date_val) {
            this.handleEarthquakeDateChange();
            this.earthquakeView = true;
            this.handleAddWeeksBeforeAndAfter(this.earthquake_date_val.getDate());
        }
    }
    constructor() {
        super();
        const styles = document.createElement('link');
        styles.href = './resources/css/bootstrap.css';
        styles.rel = 'stylesheet';
        this.template.appendChild(styles);
    }

    async connectedCallback() {
        const [vlf_amp_month, vlf_phase_month, countDays, dLengths] =
            await fetch(
                `/vlfRaw?month=${this.month}&year=${this.year}&amp=${this.amp}&phase=${this.phase}&isDay=${this.partOfDay}`
            )
                .then(function (response) {
                    return response.json();
                })
                .catch((err) => console.log(err));
        const [vlf_amp_avg_month, vlf_phase_avg_month] = await fetch(
            `/vlfAvg?month=${this.month}&year=${this.year}&amp=${this.amp}&phase=${this.phase}&isDay=${this.partOfDay}`
        )
            .then(function (response) {
                return response.json();
            })
            .catch((err) => console.log(err));
        this.month_len = this.range(1, countDays);
        this.vlf_amp = [...vlf_amp_month];
        this.vlf_amp_avg = [...vlf_amp_avg_month];
        this.vlf_phase = [...vlf_phase_month];
        this.vlf_phase_avg = [...vlf_phase_avg_month];
        this.dayLengths = dLengths;
        setTimeout(() => {
            this.sendVLF();
            this.chart = this.chartCreator(vlf_amp_month, 'VLF raw amplitude data', '.myChart');
            this.chart2 = this.chartCreator(vlf_phase_month, 'VLF raw phase data', '.myChart2');
            this.chart3 = this.chartCreator(vlf_amp_avg_month, 'Difference VLF amplitude data', '.myChart3');
            this.chart4 = this.chartCreator(vlf_phase_avg_month, 'VLF difference phase data', '.myChart4');
            this.loading = false;
        }, 100);
    }

    async handleAddWeeksBeforeAndAfter(d) {
      const [vlf_amp_month, vlf_phase_month, dayLengths] = await fetch(`/vlfEarth?month=${this.month}&year=${this.year}&amp=${this.amp}&phase=${this.phase}&isDay=${this.partOfDay}&whichDay=${d}`).then(function (response) {
                    return response.json();
                  }).catch((err) => console.log(err));
      let index;
      this.chart5 = this.chartCreator(vlf_amp_month, 'VLF amplitude data week before and week after earthquake', '.myChart5');
      this.chart6 = this.chartCreator(vlf_phase_month, 'VLF phase data week before and week after earthquake', '.myChart6');
      if (this.partOfDay !== 'night') {
        index = 7 * 4320;
      } else {
        index = 0;
        if(Boolean(dayLengths) && dayLengths.length > 0){
          for (let i = 0; i < 7; i++) {
            index += dayLengths[i];
        }
        }
      }
      this.chart5?.series[1]?.setData([{ x: index, y: vlf_amp_month[index]}]);
      this.chart6?.series[1]?.setData([{ x: index, y: vlf_phase_month[index]}]);
    }

    chartCreator(data, title, chartId) {
      return Highcharts.chart(
        this.template.querySelector(chartId),
        {
            colors: ['#9372FC', '#65FC6E'],

            chart: {
                zoomType: 'x'
            },
            title: {
                text: title
            },
            xAxis: {
                tickInterval: 4320
            },

            series: [
                {
                    name: title,
                    data: data
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
    }
    handleEarthquakeDateChange() {
        if (this.earthquake_date_val !== this.prev_earthquake_date_val && this.partOfDay !== 'night') {
            let index = Boolean(this.whichDay) ? (this.earthquake_date_val.getHours() - 2) * 180 : (this.earthquake_date_val.getDate()) * 4320;
            this.chart?.series[1]?.setData([
                { x: index, y: this.vlf_amp[index] }
            ]);
            this.chart2?.series[1]?.setData([
                { x: index, y: this.vlf_phase[index] }
            ]);
            this.chart3?.series[1]?.setData([
                { x: index, y: this.vlf_amp_avg[index] }
            ]);
            this.chart4?.series[1]?.setData([
                { x: index, y: this.vlf_phase_avg[index] }
            ]);
        } else if (this.earthquake_date_val !== this.prev_earthquake_date_val && this.partOfDay === 'night' && this.dayLengths.length > 0) {
            let index;
            if (!Boolean(this.whichDay)) {
                index = this.calculateIndex(this.earthquake_date_val.getDate());
            } else if (this.earthquake_date_val.getHours() -1 < this.dayLengths[0]) {
                index = this.earthquake_date_val.getHours() -1 === 0 ? 0 : (this.earthquake_date_val.getHours() - 2) * 180;
            } else if (this.earthquake_date_val.getHours()- 1 > this.dayLengths[1]) {
                index = (this.dayLengths[0] + this.dayLengths[1] - this.earthquake_date_val.getHours() - 2)* 180;
            } else {
              alert('Earthquake event occurred outside nighttime range!')
              return;
            }
            this.chart?.series[1]?.setData([
                { x: index, y: this.vlf_amp[index] }
            ]);
            this.chart2?.series[1]?.setData([
                { x: index, y: this.vlf_phase[index] }
            ]);
            this.chart3?.series[1]?.setData([
                { x: index, y: this.vlf_amp_avg[index] }
            ]);
            this.chart4?.series[1]?.setData([
                { x: index, y: this.vlf_phase_avg[index] }
            ]);
        }
    }

    calculateIndex(index) {
        let sum = 0;
        for (let i = 0; i < index; i++) {
            sum += this.dayLengths[i];
        }
        return sum;
    }

    handleStation(evt) {
        const station = evt.target.value;
        this.amp =
            station === 'NWC'
                ? 0
                : station === 'JJI'
                ? 4
                : station === 'JJY'
                ? 6
                : 2;
        this.phase =
            station === 'NWC'
                ? 1
                : station === 'JJI'
                ? 5
                : station === 'JJY'
                ? 7
                : 3;
    }

    handleMonth(evt) {
        this.month = evt.target.value;
    }
    handleYear(evt) {
        this.year = evt.target.value;
    }
    handleDayNight(evt) {
        this.partOfDay = evt.target.value;
    }
    handleView(evt) {
        if (evt.target.value === 'day') {
            this.day = true;
            this.handleDataChange(1);
        } else {
            this.day = false;
            this.handleDataChange(undefined);
        }
    }
    handleDataChange(range) {
        this.setData(
            this.vlf_amp,
            this.vlf_phase,
            this.vlf_amp_avg,
            this.vlf_phase_avg
        );
        this.sendVLF();
        this.whichDay = range;
    }
    handleDay(evt) {
        const day = evt.target.value;
        this.handleDataChange(day);
    }

    async handleChange() {
        this.loading = true;
        const [vlf_amp_month, vlf_phase_month, countDays, dLengths] =
            await fetch(
                `/vlfRaw?month=${this.month}&year=${this.year}&amp=${this.amp}&phase=${this.phase}&isDay=${this.partOfDay}&whichDay=${this.whichDay}`
            )
                .then(function (response) {
                    return response.json();
                })
                .catch((err) => console.log(err));
        const [vlf_amp_avg_month, vlf_phase_avg_month] = await fetch(
            `/vlfAvg?month=${this.month}&year=${this.year}&amp=${this.amp}&phase=${this.phase}&isDay=${this.partOfDay}&whichDay=${this.whichDay}`
        )
            .then(function (response) {
                return response.json();
            })
            .catch((err) => console.log(err));
        this.month_len = this.range(1, countDays);
        this.vlf_amp = [...vlf_amp_month];
        this.vlf_amp_avg = [...vlf_amp_avg_month];
        this.vlf_phase = [...vlf_phase_month];
        this.vlf_phase_avg = [...vlf_phase_avg_month];
        this.dayLengths = [...dLengths];

        this.handleDataChange(this.whichDay);

        const data = {
            month: this.month,
            year: this.year,
            station: this.amp,
            day: this.whichDay,
            isDay: this.partOfDay
        };
        this.dispatchEvent(
            new CustomEvent('senddata', {
                detail: data
            })
        );
    }

    setData(amp, phase, amp_avg, phase_avg) {
        try {
            this.chart?.series[0]?.setData(amp);
            this.chart2?.series[0]?.setData(phase);
            this.chart4?.series[0]?.setData(phase_avg);
            this.chart3?.series[0]?.setData(amp_avg);
            this.chart?.series[1]?.setData([]);
            this.chart2?.series[1]?.setData([]);
            this.chart4?.series[1]?.setData([]);
            this.chart3?.series[1]?.setData([]);
            this.earthquakeView = false;
            this.chart5?.series[0]?.setData([]);
            this.chart6?.series[0]?.setData([]);
            this.chart5?.series[1]?.setData([]);
            this.chart6?.series[1]?.setData([]);
            if (this.whichDay) {
                this.chart.xAxis[0].options.tickInterval = 180;
                this.chart2.xAxis[0].options.tickInterval = 180;
                this.chart3.xAxis[0].options.tickInterval = 180;
                this.chart4.xAxis[0].options.tickInterval = 180;
            }
        } catch (err) {
            console.log(err);
        }
        this.loading = false;
    }

    range(start, end) {
        return Array.from({ length: end - start + 1 }, (_, i) => i);
    }

    getMax(arr) {
        let max = arr[0];
        for (let i = 1; i < arr.length; ++i) {
            if (arr[i] > max) {
                max = arr[i];
            }
        }
    }
    getMin(arr) {
        let max = arr[0];
        for (let i = 1; i < arr.length; ++i) {
            if (arr[i] < max) {
                max = arr[i];
            }
        }
    }

    handleFlux(evt) {
        this.protons = evt.detail.protons;
        this.electrons = evt.detail.electrons;
        this.sendVLF();
    }

    async sendVLF() {
        let r = await fetch(
            `/stats?month=${this.month}&year=${this.year}&day=${this.whichDay}&isDay=${this.partOfDay}&station=${this.amp}`
        )
            .then(function (response) {
                return response.json();
            })
            .catch((err) => console.log(err));
        if (Object.keys(r.length !== 0)) {
            this.corr.ea = r.ea;
            this.corr.pa = r.pa;
            this.corr.ep = r.ep;
            this.corr.pp = r.pp;
            this.corr = { ...this.corr };
        }
    }
}