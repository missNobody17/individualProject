const haversine=require("haversine-distance"),ellipseToPolygon=require("ellipse-to-polygon"),COORD={JJY:{lat:37.372557,long:140.849007},JJI:{lat:32.092247,long:130.829095},NWC:{lat:-21.816325,long:114.16546},NPM:{lat:21.420382,long:158.153912},PTK:{lat:53.09,long:158.55}};let wavelengths={JJY:40,JJI:22.2,NWC:19.8,NPM:21.4};const fresnelzone=(t,e,n,a,l)=>Math.sqrt(t*e*n*a/l)/1e3,wavelength=t=>3*10**8/(1e3*t),toRadians=function(t){return t*Math.PI/180};Math.toDegrees=function(t){return 180*t/Math.PI};const midpoint=(t,e,n,a)=>{let l=toRadians(a-e);t=toRadians(t),n=toRadians(n),e=toRadians(e);let o=Math.cos(n)*Math.cos(l),s=Math.cos(n)*Math.sin(l),i=Math.atan2(Math.sin(t)+Math.sin(n),Math.sqrt((Math.cos(t)+o)*(Math.cos(t)+o)+s*s)),h=e+Math.atan2(s,Math.cos(t)+o);return[Math.toDegrees(i),Math.toDegrees(h)]},GetEllipseAxisLengths=(t,e,n,a,l,o)=>{let s=haversine({latitude:t,longitude:e},{latitude:n,longitude:a})/2;return[s,1e3*fresnelzone(o,s,s,3*10**8/(1e3*wavelengths[l]),2*s)]},GetEllipsePoints=(t,e)=>{e=parseInt(e,10);let[n,a]=[COORD.PTK.lat,COORD.PTK.long],[l,o]=[COORD[t].lat,COORD[t].long],s=midpoint(n,a,l,o)[0],i=midpoint(n,a,l,o)[1],h=l-n,r=o-a,M=Math.atan(r/h)*(180/Math.PI),[g,p]=GetEllipseAxisLengths(n,a,l,o,t,e),u=ellipseToPolygon([i,s],p,g,"NWC"!==t?M-10:M-2),d=[];return u.forEach((t=>d.push([t[0],t[1]]))),d};module.exports={GetEllipsePoints};