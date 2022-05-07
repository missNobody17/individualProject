const Statistics=require("statistics.js"),vlf=require("./vlfdata"),ftp=require("./ftpAccess"),calculateCorrelation=(t,e)=>{const r=[];for(let a=0;a<t.length;a++)r.push({arr1:t[a],arr2:e[a]});return new Statistics(r,{arr1:"interval",arr2:"interval"}).correlationCoefficient("arr1","arr2")},lowerData=(t,e)=>{const r=Math.round(e.length/t),a=[];let o=0;for(let t=0;t<e.length;t+=r){for(let a=0;a<r;a++)o+=e[t+a];a.push(o/r)}return a},init=async(t,e,r,a,o,l,n)=>{const[i,c]=await vlf.rawData(t,e,o,parseInt(o,10)+1,a,l,n),s=await ftp.getProtons(t,e,r,a,o,l,n),[f,u]=await ftp.getElectrons(t,e,r,a,o,l,n);if(console.log(u),i&&c&&f&&s)try{const t=calculateCorrelation(f,lowerData(f.length,i)),e=calculateCorrelation(s,lowerData(f.length,i)),r=calculateCorrelation(f,lowerData(f.length,c)),a=calculateCorrelation(s,lowerData(f.length,c));return{ea:t?.correlationCoefficient,pa:e?.correlationCoefficient,ep:r?.correlationCoefficient,pp:a?.correlationCoefficient}}catch(t){console.log(t)}return{}};module.exports={init};