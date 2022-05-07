/* eslint-disable no-extra-boolean-cast */
/* eslint-disable no-else-return */
/* eslint-disable no-await-in-loop */

/* eslint-disable no-shadow */
//const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const months_len_day = [31,28,31,30,31,30,31,31,30,31,30,31];
const stations = {0: 'nwc', 2: 'npm', 4: 'jji', 6: 'jjy'};
const coord = {jjy: {lat: 37.372557, long: 140.849007}, jji:{lat: 32.092247, long: 130.829095}, nwc: {lat: -21.816325, long: 114.16546}, npm: {lat: 21.420382, long: -158.153912}};


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
    let interval = hour*12 + minutes*0.2;
    if(interval < 0){
        interval = interval + 24*12
    }
    interval = parseInt(interval, 10);
    return [interval, [hour, minutes]];
}
const getSunsetSunrise = async (month, year, st, whichDay) => {
    const sunrise_sunset = [];
    const sunrise_sunset_hours = [];
    const station = stations[st];
    try{
        if (whichDay && whichDay !== 'undefined') {
            const url = `https://api.sunrise-sunset.org/json?lat=${coord[station].lat}lng=${coord[station].long}&date=${year}-${month}-${whichDay}`;
            const response = await fetch(url, {mode: 'no-cors'});
            const json = await response.json();
            const obj = json.results;
            if (Boolean(obj.astronomical_twilight_begin)) {
                sunrise_sunset.push([convertToInterval(obj.astronomical_twilight_end)[0], convertToInterval(obj.astronomical_twilight_begin)[0], convertToInterval(obj.nautical_twilight_end)[0], convertToInterval(obj.nautical_twilight_begin)[0]]);
                sunrise_sunset_hours.push([convertToInterval(obj.astronomical_twilight_end)[1], convertToInterval(obj.astronomical_twilight_begin)[1], convertToInterval(obj.nautical_twilight_end)[1], convertToInterval(obj.nautical_twilight_begin)[1]]);
            }
        }
    }catch(err){
        console.log(err);
    }
    return [sunrise_sunset, sunrise_sunset_hours];
}
const removeDay = async (arr, m, year, station, whichDay) => {
    try {
        const sunrise_sunset = await getSunsetSunrise(m, year, station, whichDay);
        if (sunrise_sunset && sunrise_sunset.length > 0) {
            if (sunrise_sunset[0][0][0] === sunrise_sunset[0][0][1]) {
                arr.splice(sunrise_sunset[0][0][3], sunrise_sunset[0][0][2] - sunrise_sunset[0][0][3]);
                return [arr, [sunrise_sunset[1][0][3], sunrise_sunset[1][0][2]]];
            }
            arr.splice(sunrise_sunset[0][0][1], sunrise_sunset[0][0][0] - sunrise_sunset[0][0][1])
            return [arr, [sunrise_sunset[1][0][1], sunrise_sunset[1][0][0]]];
        }
    } catch (err) {
        console.log(err);
    }
    return [];
}

const getResponse = async (url) => {
    let text;
    try{
        const response = await fetch(url, {mode: 'no-cors'});
        text = await (await response.text());
    }catch(err){
        console.log(err);
    }
   return text;
}

export const getElectrons = async (month, year, whichDay, isDay, station, dayFrom, dayTo) => {
    let day = months_len_day[month];
    let month2 = month;
    month  = parseInt(month, 10) + 1;
    let electrons = [];
    const data = [];
    const dayLengths = [];
    let vals = [];
    whichDay = whichDay === 'undefined' ? undefined : parseInt(whichDay, 10);
    dayTo = dayTo === 'undefined' ? undefined : parseInt(dayTo, 10);
    dayFrom = dayTo === 'undefined' ? undefined : parseInt(dayFrom, 10);
    try {
        month = month > 10 ? month : `0${month}`; //8
        const url = year > 2010 ? `https://satdat.ngdc.noaa.gov/sem/goes/data/avg/${year}/${month}/goes15/csv/g15_epead_e13ew_5m_${year}${month}01_${year}${month}${day}.csv` : `https://satdat.ngdc.noaa.gov/sem/goes/data/avg/${year}/${month}/goes12/csv/g12_eps_5m_${year}${month}01_${year}${month}${day}.csv`;
        const response = await getResponse(url)
        const text = response.split('\n');
        const index = text.findIndex(el => el === 'data: \r');
        data.push(...text.slice(index + 1));
    } catch (err) {
        console.log(err);
    }
    for (let d of data) {
        let electron = year > 2010 ? parseFloat(d.split(',')[12]) : parseFloat(d.split(',')[2]);
        electrons.push(electron);
    }
    if(whichDay){
        if(parseInt(whichDay, 2) === 1){
            electrons = electrons.length === 0 ? electrons : electrons.slice(1, 288);
        } else {
            electrons =  electrons.length === 0 ? electrons : electrons.slice(288*(whichDay-1), 288*whichDay+1)
        }
    }else if(dayFrom && dayTo){
        if(dayFrom === 1){
            electrons = electrons.length === 0 ? electrons : electrons.slice(1, 288*(dayTo));
        } else {
            electrons =  electrons.length === 0 ? electrons : electrons.slice(288*(dayFrom-1), 288*(dayTo))
        }
    }else{
        electrons =  electrons.length === 0 ? electrons : electrons.slice(1);
    }
    if(!Boolean(whichDay) && isDay === 'night' && dayFrom===undefined && dayTo===undefined) {
        for(let i=1; i <= day; i++){
            if(i === 1) {
                let val = await removeDay(electrons.slice(1, 288), month2, year, station, i);
                dayLengths.push(val[0].length);
                vals.push(...val[0]);
            }else{
                let val = await removeDay(electrons.slice(288*(i-1), 288*i+1), month2, year, station, i);
                dayLengths.push(val[0].length);
                vals.push(...val[0]);
            }
        }
        return [vals, dayLengths];
    }else if(isDay === 'night'  && dayFrom && dayTo) {
        for(let i=1; i <= (dayTo-dayFrom+1); i++){
            try{
                if(i === 1) {
                    let val = await removeDay(electrons.slice(1, 288), month2, year, station, i);
                    dayLengths.push(val[0].length);
                    vals.push(...val[0]);
                }else{
                    let val = await removeDay(electrons.slice(288*(i-1), 288*i+1), month2, year, station, i);
                    dayLengths.push(val[0].length);
                    vals.push(...val[0]);
                }
            }catch(err) {
                console.log(err);
            }
        }
        return [vals, dayLengths];
    }else if(isDay === 'night' && Boolean(whichDay)) {
        try{
            let removedProtons = await removeDay(electrons, month2, year, station, whichDay);
            return [removedProtons[0], [parseFloat(String(removedProtons[1][0][0]) + '.' +  String(removedProtons[1][0][1])), parseFloat(String(removedProtons[1][1][0]) + '.' +  String(removedProtons[1][1][1]))]];
        }catch(err){
            console.log(err);
        }
    }
    return [electrons, dayLengths];
}

export const getProtons = async (month, year, whichDay, isDay, station, dayFrom, dayTo) => {
    let day = months_len_day[month];
    let month2 = month;
    month  = parseInt(month, 10) + 1;
    let protons = [];
    const data = [];
    let vals = [];
    const dayLengths = [];
    let ind;
    whichDay = whichDay === 'undefined' ? undefined : parseInt(whichDay, 10);
    dayTo = dayTo === 'undefined' ? undefined : parseInt(dayTo, 10);
    dayFrom = dayTo === 'undefined' ? undefined : parseInt(dayFrom, 10);
    try {
        month = month > 10 ? month : `0${month}`; //8
        let url = year > 2010 ? `https://satdat.ngdc.noaa.gov/sem/goes/data/avg/${year}/${month}/goes15/csv/g15_epead_cpflux_5m_${year}${month}01_${year}${month}${day}.csv` : `https://satdat.ngdc.noaa.gov/sem/goes/data/avg/${year}/${month}/goes12/csv/g12_eps_5m_${year}${month}01_${year}${month}${day}.csv`;
        const response = await getResponse(url)
        const text = response.split('\n');
        const index = text.findIndex(el => el === 'data: \r');
        ind = year > 2010 ? text.slice(index + 1)[0].split(',').findIndex(el => el === 'ZPGT5E') : text.slice(index + 1)[0].split(',').findIndex(el => el === 'p5_flux_c')
        data.push(...text.slice(index + 1));
    } catch (err) {
        console.log(err);
    }
    for (let d of data) {
        let proton = year > 2010 ? parseFloat(d.split(',')[ind]) : parseFloat(d.split(',')[ind]);
        protons.push(proton);
    }
    if(whichDay){
        if(whichDay === 1){
            protons =  protons.length === 0 ? protons : protons.slice(1, 288);
        } else {
            protons = protons.length === 0 ? protons : protons.slice(288*(whichDay-1), 288*whichDay+1)
        }
    }else if(dayFrom && dayTo){
        if(dayFrom === 1){
            protons =  protons.length === 0 ? protons : protons.slice(1, 288*(dayTo));
        } else {
            protons =  protons.length === 0 ? protons : protons.slice(288*(dayFrom-1), 288*(dayTo))
        }
    }else{
        protons =  protons.length === 0 ? protons : protons.slice(1);
    }
    if(!Boolean(whichDay) && isDay === 'night' && dayFrom===undefined && dayTo===undefined) {
        for(let i=1; i <= day; i++){
            if(i === 1) {
                let val = await removeDay(protons.slice(1, 288), month2, year, station, i);
                dayLengths.push(val[0].length); 
                vals.push(...val[0]);
            }else{
                let val = await removeDay(protons.slice(288*(i-1), 288*i+1), month2, year, station, i);
                dayLengths.push(val[0].length);
                vals.push(...val[0]); 
            }
        }
        return vals;
    }else if(isDay === 'night' && dayFrom && dayTo) {
        for(let i=1; i <= (dayTo-dayFrom+1); i++){
            if(i === 1) {
                let val = await removeDay(protons.slice(1, 288), month2, year, station, i);
                dayLengths.push(val[0].length); 
                vals.push(...val[0]);
            }else{
                let val = await removeDay(protons.slice(288*(i-1), 288*i+1), month2, year, station, i);
                dayLengths.push(val[0].length);
                vals.push(...val[0]); 
            }
        }
        return vals;
    }else if(isDay === 'night' && Boolean(whichDay)) {
        let removedProtons = await removeDay(protons, month2, year, station, whichDay);
        return removedProtons[0];
    }
    return protons;
}
