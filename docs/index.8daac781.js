const e=document.querySelector("#input"),t=document.querySelector("#output"),n=document.querySelector("#regex"),r=document.querySelector("#template"),u=document.querySelector("#regex-panel");function l(){try{let l=new RegExp(n.value),a=r.value.split(/\$\{([\d:]+)\}/g).map((e,t)=>(function(e,t){if(t)return()=>e;let n=e.indexOf(":");if(-1===n)return t=>t[e];let r=e.substring(0,n),u=e.substring(n+1);return e=>{let t=e[r];return u.substring(0,u.length-t.length)+t}})(e,t%2==0));t.value=e.value.split("\n").filter(e=>e.trim()).map(e=>{let t=l.exec(e);return t?a.map(e=>e(t)).join(""):""}).join("\n"),u.className="panel"}catch(e){u.className="panel error",t.value=e.message}}e.value=`beatles/1-love-me-do.mp3
beatles/2-she-loves-you.mp3
beatles/3-paperback-writer.mp3
kinks/1-sunny-afternoon.mp3
kinks/2-waterloo-sunset.mp3`,n.value="([a-z]+)/(\\d\\d)-([a-z-]+).mp3",r.value="artist ${1} track ${2:00} title ${3}",e.addEventListener("input",l),n.addEventListener("input",l),r.addEventListener("input",l),l();
//# sourceMappingURL=index.8daac781.js.map
