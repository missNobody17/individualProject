const Statistics = require('statistics.js');
const vlf = require('./vlfdata');
const ftp = require('./ftpAccess');

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

const standardDeviation = (values) => {
    let avg = average(values);
    
    let squareDiffs = values.map(function(value){
      let difference = value - avg;
      let sqrDifference = difference * difference;
      return sqrDifference;
    });
    
    let avgSquareDifference = average(squareDiffs);
  
    var stdDeviation = Math.sqrt(avgSquareDifference);
    return stdDeviation;
}

const normalizeData = (arr) => {
    const std = standardDeviation(arr);
    const mean = average(arr);
    const newArr = [];
    for(let a of arr) {
        newArr.push(std === 0 ? a : (a-mean)/std);
    }
    return newArr;
}

const calculateCorrelation = (arr1,arr2) => {
    //arr1 = [...normalizeData(arr1)];
    //arr2 = [...normalizeData(arr2)];
    const dict = [];
    for(let i = 0; i<arr1.length; i++) {
        dict.push({'arr1': arr1[i], 'arr2': arr2[i]});
    }
    const bodyVars = {
        arr1: 'interval',
        arr2: 'interval'
    };
    
    const stats = new Statistics(dict, bodyVars);
    const r = stats.correlationCoefficient('arr1', 'arr2');
    return r;
}

const lowerData = (smallerDataLen, arrayToReduce) => {
    const howMany = Math.round(arrayToReduce.length / smallerDataLen);
    const arr = [];
    let avg = 0;
    for(let i = 0; i < arrayToReduce.length; i += howMany) {
        for(let j=0; j<howMany; j++){
            avg += arrayToReduce[i+j];
        }
        arr.push(avg/howMany);
    }
    return arr;
}

const init = async (month, year, whichDay, isDay, station) => {
    const [vlf_amp, vlf_phase] = await vlf.rawData(month, year , station, parseInt(station, 10) + 1, isDay, whichDay);
    const [electrons, dLengths] = await ftp.getElectrons(month, year, whichDay, isDay, station);
    const protons = await ftp.getProtons(month, year, whichDay, isDay, station);
    if (vlf_amp && vlf_phase && electrons && protons) {
        try {
            const r1 = calculateCorrelation(electrons, lowerData(electrons.length, vlf_amp));
            const r2 = calculateCorrelation(protons, lowerData(electrons.length, vlf_amp));
            const r3 = calculateCorrelation(electrons, lowerData(electrons.length, vlf_phase));
            const r4 = calculateCorrelation(protons, lowerData(electrons.length, vlf_phase));
            return { ea: r1.correlationCoefficient, pa: r2.correlationCoefficient, ep: r3.correlationCoefficient, pp: r4.correlationCoefficient };
        }catch(err){
            console.log(err);
        }
    }
    return {};

}

module.exports = {init};
