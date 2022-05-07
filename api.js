const compression=require("compression"),helmet=require("helmet"),express=require("express"),f=require("./points"),vlf=require("./vlfdata"),ftp=require("./ftpAccess"),stat=require("./calculateCorr"),path=require("path"),app=express();app.use(helmet()),app.use(compression());const HOST=process.env.API_HOST||"localhost",PORT=process.env.API_PORT||3002;app.use("/api/point",express.static(path.join(__dirname,"/points.js"))),app.get("/vlfRaw",(async(e,r)=>{const[a,t,s,y]=await vlf.rawData(e.query.month,e.query.year,e.query.amp,e.query.phase,e.query.isDay,e.query.whichDay,e.query.dayFrom,e.query.dayTo);return r.send([a,t,s,y])})),app.get("/vlfAvg",(async(e,r)=>{const[a,t]=await vlf.difference(e.query.month,e.query.year,e.query.amp,e.query.phase,e.query.isDay,e.query.whichDay,e.query.dayFrom,e.query.dayTo);return r.send([a,t])})),app.get("/vlfEarth",(async(e,r)=>{const[a,t,s]=await vlf.weekBeforeAfter(e.query.month,e.query.year,e.query.amp,e.query.phase,e.query.isDay,e.query.whichDay);return r.send([a,t,s])})),app.get("/electrons",(async(e,r)=>{const[a,t]=await ftp.getElectrons(e.query.month,e.query.year,e.query.day,e.query.isDay,e.query.station,e.query.dayFrom,e.query.dayTo);return r.send([a,t])})),app.get("/protons",(async(e,r)=>{const a=await ftp.getProtons(e.query.month,e.query.year,e.query.day,e.query.isDay,e.query.station,e.query.dayFrom,e.query.dayTo);return r.send(a)})),app.get("/api/point",((e,r)=>r.send(f.GetEllipsePoints(e.query.station,e.query.n)))),app.get("/stats",(async(e,r)=>{const a=await stat.init(e.query.month,e.query.year,e.query.day,e.query.isDay,e.query.station,e.query.dayFrom,e.query.dayTo);return r.send(a)})),app.get("/api/v1/endpoint",((e,r)=>{r.json({success:!0})})),app.listen(PORT,(()=>console.log(`✅  API Server started: http://${HOST}:${PORT}/api/v1/endpoint`)));