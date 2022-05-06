/* eslint-disable guard-for-in */
/* eslint-disable no-extra-boolean-cast */
/* eslint-disable no-await-in-loop */
const fs = require('fs');
//const { remove } = require('lodash');
const path = require('path');
// eslint-disable-next-line no-shadow
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const months_len_day = [31,28,31,30,31,30,31,31,30,31,30,31];
const months = ['JAN','FEB','MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const coord = {jjy: {lat: 37.372557, long: 140.849007}, jji:{lat: 32.092247, long: 130.829095}, nwc: {lat: -21.816325, long: 114.16546}, npm: {lat: 21.420382, long: 158.153912}, ptk: {lat: 53.15, long: 158.92}};
//const stations = {0: 'nwc', 2: 'npm', 4: 'jji', 6: 'jjy'};
const getData = (file) => {
    const filePath = path.join(__dirname, file);
    const data = fs.readFileSync(filePath, 'utf8');
    return data;
}


const csvToArray = (str) => {
    const rows = str.slice(str.indexOf("\n") + 1).split("\n")
    return rows;
}

const average = (data) => {
    let sum = 0;
    for(let d of data.flat(Infinity)){
        if(d) {
            sum+= d;
        }
    }
    const avg = (sum / data.length) || 0;
    return avg
}

/*const stdDevation = (array) => {
    const n = array.length
    const mean = average(array);
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
}*/


const arraySubstract = (arr1, avg) => {
    const arr2 = [];
    for(let el of arr1) {
        arr2.push(el - avg);
    }
    return arr2;
}
const convertTime12to24 = (time12h) => {
    const [time, modifier] = time12h.split(' ');
  
    // eslint-disable-next-line no-unused-vars
    let [hours, minutes, seconds] = time.split(':');
  
    if (hours === '12') {
      hours = '00';
    }
  
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    return `${hours}.${minutes}`;
  }
  const convertToInterval = (time12h) => {
    const timeInt = convertTime12to24(time12h);
    let hour = Math.floor(timeInt);
    let minutes = Math.round((timeInt - hour)*100)
    let interval = hour*180 + minutes*3;
    if(interval < 0){
        interval = interval + 24*180
    }
    return [interval, [hour, minutes]];
}

const getSunsetSunrise = async (month, year, st, whichDay) => {
    const sunrise_sunset = [];
    const sunrise_sunset_hours = [];
    if (whichDay) {
        const url = `https://api.sunrise-sunset.org/json?lat=${coord.ptk.lat}lng=${coord.ptk.long}&date=${year}-${month}-${whichDay}`;
        const response = await fetch(url);
        const json = await response.json();
        const obj = json.results;
        if (Boolean(obj.astronomical_twilight_begin)) {
            sunrise_sunset.push([convertToInterval(obj.astronomical_twilight_end)[0], convertToInterval(obj.astronomical_twilight_begin)[0], convertToInterval(obj.nautical_twilight_end)[0], convertToInterval(obj.nautical_twilight_begin)[0]]);
            sunrise_sunset_hours.push([convertToInterval(obj.astronomical_twilight_end)[1], convertToInterval(obj.astronomical_twilight_begin)[1], convertToInterval(obj.nautical_twilight_end)[1], convertToInterval(obj.nautical_twilight_begin)[1]]);
        }
    }
    return [sunrise_sunset, sunrise_sunset_hours];
}
const removeDay = async (arr, m, year, station, whichDay) => {
    const sunrise_sunset = await getSunsetSunrise(m, year, station, whichDay);
    if(sunrise_sunset[0][0][0] === sunrise_sunset[0][0][1]) {
        arr.splice(sunrise_sunset[0][0][3], sunrise_sunset[0][0][2]-sunrise_sunset[0][0][3]);
        return [arr, [sunrise_sunset[1][0][3], sunrise_sunset[1][0][2]]];
    }
    arr.splice(sunrise_sunset[0][0][1], sunrise_sunset[0][0][0]-sunrise_sunset[0][0][1])
    return [arr, [sunrise_sunset[1][0][1], sunrise_sunset[1][0][0]]];
}

const rawData = async (m, year, station_amp, station_phase, isDay, whichDay, dayFrom, dayTo) => {
    const vlf_amp_month = [];
    const vlf_phase_month = [];
    const month = months[parseInt(m, 10)];
    const month_len = months_len_day[m];
    const lastDigit = parseInt(year, 10) % 10;
    const dayLengths = [];
    let countDays = 0;
    dayTo = dayTo === 'undefined' ? undefined : parseInt(dayTo, 10);
    dayFrom = dayTo === 'undefined' ? undefined : parseInt(dayFrom, 10);
    let data;
    whichDay = whichDay === 'undefined' ? undefined : parseInt(whichDay, 10);
    if(Boolean(whichDay)){
        if(whichDay > 0 && whichDay < 10){ //Load data
            try{
                data = await getData(`./VLF-data/${year}/${month}/T0${whichDay}${month}${lastDigit}A.kam`);
            }catch(err) {
                console.log(err);
            }
        }else {  //Load data
            try{
                data = await getData(`/VLF-data/${year}/${month}/T${whichDay}${month}${lastDigit}A.kam`);
            }catch(err) {
                console.log(err);
            }
        }
        if(data){
            for(let res of csvToArray(data)) {
                if(res !== undefined && Boolean(res.split(/\t/)[station_amp])) { //&& (j<1620  || j>3240)
                    vlf_amp_month.push(parseFloat(res.split(/\t/)[station_amp]));
                }
                if(res !== undefined && Boolean(res.split(/\t/)[station_phase])){ //&& (j<1620  || j>3240)
                    vlf_phase_month.push(parseFloat(res.split(/\t/)[station_phase]));
                }
            }
        }
        countDays =  months_len_day[m];
        if(isDay === 'night'){
            const removedAmp = await removeDay(vlf_amp_month, m, year, station_amp, whichDay);
            const removedPhase = await removeDay(vlf_phase_month, m, year, station_amp,whichDay);
            return [removedAmp[0], removedPhase[0], countDays, [parseFloat(String(removedAmp[1][0][0]) + '.' +  String(removedAmp[1][0][1])), parseFloat(String(removedAmp[1][1][0]) + '.' +  String(removedAmp[1][1][1]))]];
        }
    } else if(Boolean(dayFrom) && Boolean(dayTo)){
        for(let i=dayFrom; i<=dayTo; i++) {
            let valuesAmp = [];
            let valuesPhase = [];
            if(i > 0 && i < 10){ //Load data
                try{
                    data = await getData(`./VLF-data/${year}/${month}/T0${i}${month}${lastDigit}A.kam`);
                }catch(err) {
                    console.log(err);
                    break;
                }
            }else {  //Load data
                try{
                    data = await getData(`/VLF-data/${year}/${month}/T${i}${month}${lastDigit}A.kam`);
                }catch(err) {
                    console.log(err);
                    break;
                }
            }
            if(data){
                for(let res of csvToArray(data)) {
                    if(res !== undefined && Boolean(res.split(/\t/)[station_amp])) { //&& (j<1620  || j>3240)
                        valuesAmp.push(parseFloat(res.split(/\t/)[station_amp]));
                    }
                    if(res !== undefined && Boolean(res.split(/\t/)[station_phase])){ //&& (j<1620  || j>3240)
                        valuesPhase.push(parseFloat(res.split(/\t/)[station_phase]));
                    }
                }
                if(isDay === 'night'){
                    const removedAmp = await removeDay(valuesAmp, m, year, station_amp, i);
                    const removedPhase = await removeDay(valuesPhase, m, year, station_amp, i);
                    dayLengths.push(removedAmp[0].length); 
                    vlf_amp_month.push(...removedAmp[0]);
                    vlf_phase_month.push(...removedPhase[0]);
                }else {
                    vlf_amp_month.push(...valuesAmp);
                    vlf_phase_month.push(...valuesPhase);
                }
            
            }
        }
        countDays =  months_len_day[m];

    }else {
        for(let i = 1; i < month_len+1; i++){
            let valuesAmp = [];
            let valuesPhase = [];
            if(i > 0 && i < 10){ //Load data
                try{
                    data = await getData(`./VLF-data/${year}/${month}/T0${i}${month}${lastDigit}A.kam`);
                }catch(err) {
                    console.log(err);
                    break;
                }
            }else {  //Load data
                try{
                    data = await getData(`/VLF-data/${year}/${month}/T${i}${month}${lastDigit}A.kam`);
                }catch(err) {
                    console.log(err);
                    break;
                }
            }
            if(data){
                for(let res of csvToArray(data)) {
                    if(res !== undefined && Boolean(res.split(/\t/)[station_amp])) { //&& (j<1620  || j>3240)
                        valuesAmp.push(parseFloat(res.split(/\t/)[station_amp]));
                    }
                    if(res !== undefined && Boolean(res.split(/\t/)[station_phase])){ //&& (j<1620  || j>3240)
                        valuesPhase.push(parseFloat(res.split(/\t/)[station_phase]));
                    }
                }
                if(isDay === 'night'){
                    const removedAmp = await removeDay(valuesAmp, m, year, station_amp, i);
                    const removedPhase = await removeDay(valuesPhase, m, year, station_amp, i);
                    dayLengths.push(removedAmp[0].length); 
                    vlf_amp_month.push(...removedAmp[0]);
                    vlf_phase_month.push(...removedPhase[0]);
                }else {
                    vlf_amp_month.push(...valuesAmp);
                    vlf_phase_month.push(...valuesPhase);
                }
            
            }
            countDays += 1;
        }
    }
    return [vlf_amp_month, vlf_phase_month, countDays, dayLengths];
}

const averageData = async(m, year, station_amp, station_phase) => {
    const vlf_amp_avg_month = [];
    const vlf_phase_avg_month = [];
    const month = months[parseInt(m, 10)];
    const month_len = months_len_day[m];
    const lastDigit = parseInt(year, 10) % 10;
    let data;
    for(let i = 1; i < month_len+1; i++){
        if(i > 0 && i < 10){ //Load data
            try{
                data = await getData(`/VLF-data/${year}/${month}/T0${i}${month}${lastDigit}A.kam`, 'utf8');   
            }catch(err) {
                console.log(err);
                break;
            }
        }else {  //Load data
            try{
                // eslint-disable-next-line no-await-in-loop
                data = await getData(`/VLF-data/${year}/${month}/T${i}${month}${lastDigit}A.kam`);
            }catch(err) {
                console.log(err);
                break;
            }
        }
        if (data) {
            let dayValuesAmp = [];
            let dayValuesPhase = [];
            for (let res of csvToArray(data)) {
                if (res !== undefined && Boolean(res.split(/\t/)[station_amp])) { //&& (j<1620  || j>3240)
                    dayValuesAmp.push(parseFloat(res.split(/\t/)[station_amp]));
                }
                if (res !== undefined && Boolean(res.split(/\t/)[station_phase])) { //&& (j<1620  || j>3240)
                    dayValuesPhase.push(parseFloat(res.split(/\t/)[station_phase]));
                }
            }
            vlf_amp_avg_month.push(average(dayValuesAmp));
            vlf_phase_avg_month.push(average(dayValuesPhase));
        }
    }
    return [vlf_amp_avg_month, vlf_phase_avg_month];
}
const avg = async(m, year, station_amp, station_phase, whichDay, dayFrom, dayTo) => {
    const vlf_amp_avg_month = [];
    const vlf_phase_avg_month = [];
    const month = months[parseInt(m, 10)];
    const prev_month = m !== 1 ? months[parseInt(m, 10)-1] : 'DEC';
    const prev_year = m === 1 ? year - 1 : undefined;
    const month_len = months_len_day[m];
    const prev_month_len = m === 1 ?  months_len_day[12] :  months_len_day[m-1];
    const lastDigit = parseInt(year, 10) % 10;
    whichDay = whichDay === 'undefined' ? undefined : parseInt(whichDay, 10);
    let data;
    if (whichDay) {
        let valuesAmp = [];
        let valuesPhase = [];
        for (let j = whichDay - 5; j < whichDay + 1; j++) {
            if (j < 1) {
                try {
                    data = Boolean(prev_year) ? await getData(`/VLF-data/${prev_year}/${prev_month}/T${prev_month_len + j}${prev_month}${(parseInt(prev_year, 10) % 10)}A.kam`, 'utf8') : await getData(`/VLF-data/${year}/${prev_month}/T${prev_month_len + j}${prev_month}${lastDigit}A.kam`, 'utf8');
                } catch (err) {
                    console.log(err);
                    break;
                }
            }
            else if (j > 0 && j < 10) { //Load data
                try {
                    data = await getData(`/VLF-data/${year}/${month}/T0${j}${month}${lastDigit}A.kam`, 'utf8');
                } catch (err) {
                    console.log(err);
                    break;
                }
            } else {  //Load data
                try {
                    data = await getData(`/VLF-data/${year}/${month}/T${j}${month}${lastDigit}A.kam`);
                } catch (err) {
                    console.log(err);
                    break;
                }
            }
            if (data) {
                for (let res of csvToArray(data)) {
                    if (res !== undefined && Boolean(res.split(/\t/)[station_amp])) {  // && (j<1620  || j>3240)
                        valuesAmp.push(parseFloat(res.split(/\t/)[station_amp]));
                    }
                    if (res !== undefined && Boolean(res.split(/\t/)[station_phase])) { // && (j<1620  || j>3240)
                        valuesPhase.push(parseFloat(res.split(/\t/)[station_phase]));
                    }
                }
            }
        }
        vlf_amp_avg_month.push(average(valuesAmp));
        vlf_phase_avg_month.push(average(valuesPhase));
    }else if(Boolean(dayFrom) && Boolean(dayTo)){
        for(let i=dayFrom; i<=dayTo; i++) {
            let valuesAmp = [];
            let valuesPhase = [];
            for(let j = i-5; j<i+1; j++){
                if(j < 1) {
                    try{
                        data = Boolean(prev_year) ? await getData(`/VLF-data/${prev_year}/${prev_month}/T${prev_month_len+j}${prev_month}${(parseInt(prev_year, 10) % 10)}A.kam`, 'utf8') : await getData(`/VLF-data/${year}/${prev_month}/T${prev_month_len+j}${prev_month}${lastDigit}A.kam`, 'utf8');
                    }catch(err) {
                        console.log(err);
                        break;
                    }
                }
                else if(j > 0 && j < 10){ //Load data
                    try{
                        data = await getData(`/VLF-data/${year}/${month}/T0${j}${month}${lastDigit}A.kam`, 'utf8');
                    }catch(err) {
                        console.log(err);
                        break;
                    }
                }else {  //Load data
                    try{
                        data = await getData(`/VLF-data/${year}/${month}/T${j}${month}${lastDigit}A.kam`);
                    }catch(err) {
                        console.log(err);
                        break;
                    }
                }
                if (data) {
                    for (let res of csvToArray(data)) {
                        if (res !== undefined && Boolean(res.split(/\t/)[station_amp])) {  // && (j<1620  || j>3240)
                            valuesAmp.push(parseFloat(res.split(/\t/)[station_amp]));
                        }
                        if (res !== undefined && Boolean(res.split(/\t/)[station_phase])) { // && (j<1620  || j>3240)
                            valuesPhase.push(parseFloat(res.split(/\t/)[station_phase]));
                        }
                    }
                }
            }
            vlf_amp_avg_month.push(average(valuesAmp));
            vlf_phase_avg_month.push(average(valuesPhase));
        }
    }else {
        for(let i = 1; i < month_len+1; i++){
            let valuesAmp = [];
            let valuesPhase = [];
            for(let j = i-5; j<i+1; j++){
                if(j < 1) {
                    try{
                        data = Boolean(prev_year) ? await getData(`/VLF-data/${prev_year}/${prev_month}/T${prev_month_len+j}${prev_month}${(parseInt(prev_year, 10) % 10)}A.kam`, 'utf8') : await getData(`/VLF-data/${year}/${prev_month}/T${prev_month_len+j}${prev_month}${lastDigit}A.kam`, 'utf8');
                    }catch(err) {
                        console.log(err);
                        break;
                    }
                }
                else if(j > 0 && j < 10){ //Load data
                    try{
                        data = await getData(`/VLF-data/${year}/${month}/T0${j}${month}${lastDigit}A.kam`, 'utf8');
                    }catch(err) {
                        console.log(err);
                        break;
                    }
                }else {  //Load data
                    try{
                        data = await getData(`/VLF-data/${year}/${month}/T${j}${month}${lastDigit}A.kam`);
                    }catch(err) {
                        console.log(err);
                        break;
                    }
                }
                if (data) {
                    for (let res of csvToArray(data)) {
                        if (res !== undefined && Boolean(res.split(/\t/)[station_amp])) {  // && (j<1620  || j>3240)
                            valuesAmp.push(parseFloat(res.split(/\t/)[station_amp]));
                        }
                        if (res !== undefined && Boolean(res.split(/\t/)[station_phase])) { // && (j<1620  || j>3240)
                            valuesPhase.push(parseFloat(res.split(/\t/)[station_phase]));
                        }
                    }
                }
            }
            vlf_amp_avg_month.push(average(valuesAmp));
            vlf_phase_avg_month.push(average(valuesPhase));
        }
    }
    return [vlf_amp_avg_month, vlf_phase_avg_month]
}

const difference = async (m, year, station_amp, station_phase, isDay, whichDay, dayFrom, dayTo) => {
    const vlf_amp_month_diff = [];
    const vlf_phase_month_diff = [];
    const month = months[parseInt(m, 10)];
    const month_len = months_len_day[m];
    const lastDigit = parseInt(year, 10) % 10;
    let data;
    whichDay = whichDay === 'undefined' ? undefined : parseInt(whichDay, 10);
    dayTo = dayTo === 'undefined' ? undefined : parseInt(dayTo, 10);
    dayFrom = dayTo === 'undefined' ? undefined : parseInt(dayFrom, 10);
    const [avg_amp, avg_phase] = await avg(m, year, station_amp, station_phase, whichDay, dayFrom, dayTo);
    if (whichDay) {
        let valuesAmp = [];
        let valuesPhase = [];
        if (whichDay > 0 && whichDay < 10) { //Load data
            try {
                data = await getData(`./VLF-data/${year}/${month}/T0${whichDay}${month}${lastDigit}A.kam`);
            } catch (err) {
                console.log(err);
            }
        } else {  //Load data
            try {
                data = await getData(`/VLF-data/${year}/${month}/T${whichDay}${month}${lastDigit}A.kam`);
            } catch (err) {
                console.log(err);
            }
        }
        if (data) {
            for (let res of csvToArray(data)) {
                if (res !== undefined && Boolean(res.split(/\t/)[station_amp])) { //&& (j<1620  || j>3240)
                    valuesAmp.push(parseFloat(res.split(/\t/)[station_amp]));
                }
                if (res !== undefined && Boolean(res.split(/\t/)[station_phase])) { //&& (j<1620  || j>3240)
                    valuesPhase.push(parseFloat(res.split(/\t/)[station_phase]));
                }
            }
            vlf_amp_month_diff.push(...arraySubstract(valuesAmp, avg_amp));
            vlf_phase_month_diff.push(...arraySubstract(valuesPhase, avg_phase));
        }
        if(isDay === 'night'){
            const removedAmp = await removeDay(vlf_amp_month_diff, m, year, station_amp, whichDay);
            const removedPhase = await removeDay(vlf_phase_month_diff, m, year, station_amp, whichDay);
            return [removedAmp[0], removedPhase[0]];
        }
    } else if(Boolean(dayFrom) && Boolean(dayTo)){
        let j=0;
        for(let i=dayFrom; i<=dayTo; i++) {
            let valuesAmp = [];
            let valuesPhase = [];
            if(i > 0 && i < 10){ //Load data
                try{
                    data = await getData(`./VLF-data/${year}/${month}/T0${i}${month}${lastDigit}A.kam`);
                }catch(err) {
                    console.log(err);
                    break;
                }
            }else {  //Load data
                try{
                    data = await getData(`/VLF-data/${year}/${month}/T${i}${month}${lastDigit}A.kam`);
                }catch(err) {
                    console.log(err);
                    break;
                }
            }
            if(data){
                for(let res of csvToArray(data)) {
                    if(res !== undefined && Boolean(res.split(/\t/)[station_amp])) { //&& (j<1620  || j>3240)
                        valuesAmp.push(parseFloat(res.split(/\t/)[station_amp]));
                    }
                    if(res !== undefined && Boolean(res.split(/\t/)[station_phase])){ //&& (j<1620  || j>3240)
                        valuesPhase.push(parseFloat(res.split(/\t/)[station_phase]));
                    }
                }
                if(isDay === 'night'){
                    const removedAmp = await removeDay(valuesAmp, m, year, station_amp, i);
                    const removedPhase = await removeDay(valuesPhase, m, year, station_amp, i);
                    vlf_amp_month_diff.push(...arraySubstract(removedAmp[0], avg_amp[j]));
                    vlf_phase_month_diff.push(...arraySubstract(removedPhase[0], avg_phase[j]));
                }else {
                    vlf_amp_month_diff.push(...arraySubstract(valuesAmp, avg_amp[j]));
                    vlf_phase_month_diff.push(...arraySubstract(valuesPhase, avg_phase[j]));
                }
            }
        }
    }else {
        for(let i = 1; i < month_len+1; i++){
            let valuesAmp = [];
            let valuesPhase = [];
            if(i > 0 && i < 10){ //Load data
                try{
                    data = await getData(`./VLF-data/${year}/${month}/T0${i}${month}${lastDigit}A.kam`);
                }catch(err) {
                    console.log(err);
                    break;
                }
            }else {  //Load data
                try{
                    data = await getData(`/VLF-data/${year}/${month}/T${i}${month}${lastDigit}A.kam`);
                }catch(err) {
                    console.log(err);
                    break;
                }
            }
            if(data){
                for(let res of csvToArray(data)) {
                    if(res !== undefined && Boolean(res.split(/\t/)[station_amp])) { //&& (j<1620  || j>3240)
                        valuesAmp.push(parseFloat(res.split(/\t/)[station_amp]));
                    }
                    if(res !== undefined && Boolean(res.split(/\t/)[station_phase])){ //&& (j<1620  || j>3240)
                        valuesPhase.push(parseFloat(res.split(/\t/)[station_phase]));
                    }
                }
                if(isDay === 'night'){
                    const removedAmp = await removeDay(valuesAmp, m, year, station_amp, i);
                    const removedPhase = await removeDay(valuesPhase, m, year, station_amp, i);
                    vlf_amp_month_diff.push(...arraySubstract(removedAmp[0], avg_amp[i]));
                    vlf_phase_month_diff.push(...arraySubstract(removedPhase[0], avg_phase[i]));
                }else {
                    vlf_amp_month_diff.push(...arraySubstract(valuesAmp, avg_amp[i]));
                    vlf_phase_month_diff.push(...arraySubstract(valuesPhase, avg_phase[i]));
                }
            }
        }
    }
    return  [vlf_amp_month_diff, vlf_phase_month_diff]; 
}

const weekBeforeAfter = async (m, year, station_amp, station_phase, isDay, whichDay) => {
    const vlf_amp_avg_month = [];
    const vlf_phase_avg_month = [];
    const dayLengths = [];
    const month = months[parseInt(m, 10)];
    const prev_month = m !== 1 ? months[parseInt(m, 10)-1] : 'DEC';
    const prev_year = m === 1 ? year - 1 : undefined;
    const next_month = m !== 12 ? months[parseInt(m, 10)+1] : 'JAN';
    const next_year = m === 12 ? year + 1 : undefined;
    const month_len = months_len_day[m];
    const prev_month_len = m === 1 ?  months_len_day[12] :  months_len_day[m-1];
    const lastDigit = parseInt(year, 10) % 10;
    whichDay = whichDay === 'undefined' ? undefined : parseInt(whichDay, 10);
    let data;
    if (whichDay) {
        let valuesAmp = [];
        let valuesPhase = [];
        for (let j = whichDay - 7; j <= whichDay + 7; j++) {
            if (j < 1) {
                try {
                    data = Boolean(prev_year) ? await getData(`/VLF-data/${prev_year}/${prev_month}/T${prev_month_len + j}${prev_month}${(parseInt(prev_year, 10) % 10)}A.kam`, 'utf8') : await getData(`/VLF-data/${year}/${prev_month}/T${prev_month_len + j}${prev_month}${lastDigit}A.kam`, 'utf8');
                } catch (err) {
                    console.log(err);
                    break;
                }
            }
            else if (j > 0 && j < 10) { //Load data
                try {
                    data = await getData(`/VLF-data/${year}/${month}/T0${j}${month}${lastDigit}A.kam`, 'utf8');
                } catch (err) {
                    console.log(err);
                    break;
                }
            } else if (j > month_len) { //Load data
                try {
                    data = Boolean(next_year) ? await getData(`/VLF-data/${next_year}/${next_month}/T0${j-month_len}${next_month}${(parseInt(next_year, 10) % 10)}A.kam`, 'utf8') : await getData(`/VLF-data/${year}/${next_month}/T0${j - month_len}${next_month}${lastDigit}A.kam`, 'utf8');
                } catch (err) {
                    console.log(err);
                    break;
                }
            } else {  //Load data
                try {
                    data = await getData(`/VLF-data/${year}/${month}/T${j}${month}${lastDigit}A.kam`);
                } catch (err) {
                    console.log(err);
                    break;
                }
            }
            if (data) {
                valuesAmp = [];
                valuesPhase = [];
                for (let res of csvToArray(data)) {
                    if (res !== undefined && Boolean(res.split(/\t/)[station_amp])) {  // && (j<1620  || j>3240)
                        valuesAmp.push(parseFloat(res.split(/\t/)[station_amp]));
                    }
                    if (res !== undefined && Boolean(res.split(/\t/)[station_phase])) { // && (j<1620  || j>3240)
                        valuesPhase.push(parseFloat(res.split(/\t/)[station_phase]));
                    }
                }
                if(isDay === 'night'){
                    let i = j > month_len ? j-month_len : (j<1 ? prev_month_len + j : j);
                    const removedAmp = await removeDay(valuesAmp, m, year, station_amp, i);
                    const removedPhase = await removeDay(valuesPhase, m, year, station_amp, i);
                    vlf_amp_avg_month.push(...removedAmp[0]);
                    vlf_phase_avg_month.push(...removedPhase[0]);
                    dayLengths.push(removedAmp[0].length);
                }else {
                    vlf_amp_avg_month.push(...valuesAmp);
                    vlf_phase_avg_month.push(...valuesPhase);
                }
            }
        }
    }
    return [vlf_amp_avg_month, vlf_phase_avg_month, dayLengths];
}



  module.exports = {rawData, averageData, avg, difference, removeDay, weekBeforeAfter};