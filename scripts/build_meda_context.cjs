/* Rebuild context from checked-in actual minute-nearest observations; no dependencies. */
const fs=require('node:fs');
const rows=fs.readFileSync('docs/figures/meda-sol-0036-minute-observations.csv','utf8').trim().split(/\r?\n/);
const headers=rows.shift().split(',');
const observations=rows.map(line=>Object.fromEntries(line.split(',').map((v,i)=>[headers[i],v])));
const hours=Array.from({length:24},(_,hour)=>({hour,count:0,mean_speed_m_s:null}));
const wind_rose_counts=Array(8).fill(0);let excluded=0,calm=0;
for(const row of observations){
 const speed=row.HORIZONTAL_WIND_SPEED==='' ? NaN : Number(row.HORIZONTAL_WIND_SPEED);
 const direction=row.WIND_DIRECTION==='' ? NaN : Number(row.WIND_DIRECTION);
 const hour=Number(row.LTST.split(' ')[1]?.split(':')[0]);
 if(!Number.isFinite(speed)||speed<0||!Number.isFinite(direction)||direction<0||direction>=360||!Number.isInteger(hour)||hour<0||hour>23){excluded++;continue;}
 const h=hours[hour];h.mean_speed_m_s=(h.mean_speed_m_s || 0)+speed;h.count++;
 if(speed===0)calm++;else wind_rose_counts[Math.floor((direction+22.5)%360/45)]++;
}
for(const h of hours)if(h.count)h.mean_speed_m_s/=h.count;
const context={schema_version:1,label:'Perseverance MEDA, Sol 36 (2021), near the landing site. Not a wind field for Bright Angel.',
 source_url:'https://atmos.nmsu.edu/PDS/data/PDS4/Mars2020/mars2020_meda/data_derived_env/sol_0000_0089/sol_0036/WE__0036___________DER_WS__________________P02.CSV',
 input:'docs/figures/meda-sol-0036-minute-observations.csv',
 method:'Arithmetic mean of actual minute-nearest samples per LTST hour, not a time-weighted daily mean. No interpolation. Wind rose counts non-calm samples in eight 45° sectors; wind-from, clockwise from north. Empty hours have a missing mean (JSON null).',
 units:{speed:'m/s',direction:'degrees clockwise from north, wind-from',time:'LTST hour'},input_count:observations.length,excluded_count:excluded,calm_count:calm,hours,wind_rose_counts,
 limits:'Minute samples are a subset of valid pairs, not all raw observations. 995 of 41538 source pairs lacked valid data. No uncertainty values. Distance to B is unverified and omitted.'};
fs.writeFileSync('public/data/meda-sol-0036-context.json',JSON.stringify(context,null,2)+'\n');
