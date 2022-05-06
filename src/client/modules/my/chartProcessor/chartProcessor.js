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
    chart7;
    chart8; chart9; chart10;
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
    dayFrom = undefined;
    dayTo = undefined;
    year = 2019;
    loading = true;
    partOfDay = 'day';
    day = false;
    isTimeRange=false;
    n = 3;
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
    isClicked = false;
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
                interval: 4320
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

    scatterCreator(arr1, arr2, title, chartId, xaxisTitle, yaxisTitle) {
        let smaller = this.lowerData(arr1.length, arr2);
        let data = this.makeOneArray(arr1, smaller);
        return Highcharts.chart(this.template.querySelector(chartId), {
                chart: {
                  type: 'scatter',
                  zoomType: 'xy'
                },
                title: {
                  text: title
                },
                xAxis: {
                  title: {
                    enabled: true,
                    text: xaxisTitle
                  },
                  startOnTick: true,
                  endOnTick: true,
                  showLastLabel: true
                },
                yAxis: {
                  title: {
                    text: yaxisTitle
                  }
                },
                plotOptions: {
                  scatter: {
                    marker: {
                      radius: 5,
                      states: {
                        hover: {
                          enabled: true,
                          lineColor: 'rgb(100,100,100)'
                        }
                      }
                    },
                    states: {
                      hover: {
                        marker: {
                          enabled: false
                        }
                      }
                    },
                  }
                },
                series: [{
                  name: 'VLF Amplitude',
                  color: 'rgba(223, 83, 83, .5)',
                  data: data 
              
                }]
              });
    }
    handleEarthquakeDateChange() {
        if (this.earthquake_date_val !== this.prev_earthquake_date_val && this.partOfDay !== 'night') {
            let index = Boolean(this.whichDay) ? (this.earthquake_date_val.getHours() - 2) * 180 : ((Boolean(this.dayFrom) && Boolean(this.dayTo)) ? (this.earthquake_date_val.getDate() - this.dayFrom) * 4320 :  (this.earthquake_date_val.getDate()) * 4320);
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
                if(this.dayFrom && this.dayTo){
                    index = this.calculateIndex(this.earthquake_date_val.getDate() - this.dayFrom);
                }else {
                    index = this.calculateIndex(this.earthquake_date_val.getDate());
                }
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
    handleFresnel(evt) {
        this.n = evt.target.value;
    }

    handleDayFrom(evt) {
        this.dayFrom = evt.target.value;
    }

    handleDayTo(evt) {
        this.dayTo = evt.target.value;
    }

    handleView(evt) {
        if (evt.target.value === 'day') {
            this.day = true;
            this.isTimeRange = false;
            this.dayFrom = undefined;
            this.dayTo = undefined;
            this.handleDataChange(1);
        } else if(evt.target.value === 'month'){
            this.day = false;
            this.isTimeRange = false;
            this.dayFrom = undefined;
            this.dayTo = undefined;
            this.handleDataChange(undefined);
        }else {
            this.day = false;
            this.isTimeRange = true;
            this.dayFrom = this.dayFrom === undefined ? 1 : this.dayFrom;
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
        this.whichDay = evt.target.value;
        this.handleDataChange(this.whichDay);
    }

    async handleChange() {
        if(this.isTimeRange) {
            if(this.dayTo === undefined || parseInt(this.dayFrom, 10) > parseInt(this.dayTo, 10)){
                alert("Incorrect day specified!");
                return;
            }

        }
        this.loading = true;
        this.isClicked = true;
        const [vlf_amp_month, vlf_phase_month, countDays, dLengths] =
            await fetch(
                `/vlfRaw?month=${this.month}&year=${this.year}&amp=${this.amp}&phase=${this.phase}&isDay=${this.partOfDay}&whichDay=${this.whichDay}&dayFrom=${this.dayFrom}&dayTo=${this.dayTo}`
            )
                .then(function (response) {
                    return response.json();
                })
                .catch((err) => console.log(err));
        const [vlf_amp_avg_month, vlf_phase_avg_month] = await fetch(
            `/vlfAvg?month=${this.month}&year=${this.year}&amp=${this.amp}&phase=${this.phase}&isDay=${this.partOfDay}&whichDay=${this.whichDay}&dayFrom=${this.dayFrom}&dayTo=${this.dayTo}`
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
            isDay: this.partOfDay,
            n: this.n,
            dayFrom: this.dayFrom,
            dayTo: this.dayTo
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
        let arr = [];
        for(let i=start; i<end+1; i++ ) {
            arr.push(i);
        }
        return arr;
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
        this.isClicked = false;
        this.chart7 = this.scatterCreator(this.electrons, this.vlf_amp, 'Data Correlation between Electron Flux and VLF signal amplitude', '.myChart7', 'Electron Flux', 'VLF raw data amplitude');
        this.chart8 = this.scatterCreator(this.protons, this.vlf_amp, 'Data Correlation between Proton Flux and VLF signal amplitude', '.myChart8', 'Proton Flux', 'VLF raw data amplitude');
        this.chart9 = this.scatterCreator(this.electrons, this.vlf_phase, 'Data Correlation between Electron Flux and VLF signal phase', '.myChart9', 'Electron Flux', 'VLF raw data phase');
        this.chart10 = this.scatterCreator(this.protons, this.vlf_phase, 'Data Correlation between Proton Flux and VLF signal phase', '.myChart10', 'Proton Flux', 'VLF raw data phase');
        this.sendVLF();
    }

    async sendVLF() {
        let r = await fetch(
            `/stats?month=${this.month}&year=${this.year}&day=${this.whichDay}&isDay=${this.partOfDay}&station=${this.amp}&dayFrom=${this.dayFrom}&dayTo=${this.dayTo}`
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

    lowerData(smallerDataLen, arrayToReduce){
        const howMany = Math.round(arrayToReduce.length / smallerDataLen);
        const arr = [];
        let avg = 0;
        for(let i = 0; i < arrayToReduce.length; i += howMany) {
            avg = 0;
            for(let j=0; j<howMany; j++){
                avg += arrayToReduce[i+j];
            }
            arr.push(avg/howMany);
        }
        return arr;
    }

    makeOneArray(arr1, arr2) {
        let arr = [];
        let len = arr1.length > arr2.length ? arr2.length : arr1.length;
        for(let i =0; i<len; i++) {
            arr.push([arr1[i], arr2[i]]);
        }
        return arr;

    }
}