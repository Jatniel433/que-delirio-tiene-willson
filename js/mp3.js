/* =====================================================================
   REPRODUCTOR MP3 — se carga DESPUÉS del script principal:
   <script src="js/mp3.js"></script>   (justo antes de </body>)
   Para añadir canciones: copia el .mp3 a la carpeta audio/ y agrega una línea a PLAYLIST.
   Dentro del juego, «+ AÑADIR» carga canciones de tu dispositivo y quedan GUARDADAS en el navegador (IndexedDB).
   ===================================================================== */
(function(){
const PLAYLIST=[
  {t:'Menú principal',f:'audio/menu.mp3'},
  {t:'Pasillo',f:'audio/pasillo.mp3'},
  {t:'Aula 1',f:'audio/aula1.mp3'},
  {t:'Clase',f:'audio/aula.mp3'},
  {t:'Patio',f:'audio/patio.mp3'},
  {t:'Barrio',f:'audio/barrio.mp3'},
  {t:'Casa',f:'audio/barrio1.mp3'}
  // ,{t:'Mi canción nueva',f:'audio/mi-cancion.mp3'}
];
/* ---- canciones automáticas de la carpeta audio/ ----
   1) js/playlist.js (lo genera make-playlist.py) → funciona también abriendo el HTML directo
   2) si usas un servidor local (python -m http.server, Live Server...), se lee la carpeta sola */
const nice=f=>f.replace(/^.*\//,'').replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ');
const addSong=f=>{if(!PLAYLIST.some(s=>s.f===f))PLAYLIST.push({t:nice(f),f})};
(window.AUDIO_FILES||[]).forEach(addSong);
fetch('audio/').then(r=>r.ok?r.text():'').then(h=>{
  [...h.matchAll(/href="([^"?#]+\.(?:mp3|ogg|wav|m4a))"/gi)].forEach(m=>addSong('audio/'+decodeURIComponent(m[1]).replace(/^.*\//,'')));
  if(document.getElementById('mp3')&&!document.getElementById('mp3').hidden)ui();
}).catch(()=>{});
const MP3={on:false,i:0,shuffle:false,hist:[],list:false};
const el=id=>document.getElementById(id);
/* ---- canciones añadidas por el jugador: se guardan en IndexedDB y vuelven al abrir el juego ---- */
const SAVED=new Set();
const IDB={
  open(){if(!IDB.p)IDB.p=new Promise((res,rej)=>{if(!window.indexedDB)return rej();const r=indexedDB.open('horizonte-mp3',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('songs',{keyPath:'id',autoIncrement:true});
    r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});return IDB.p},
  all(){return IDB.open().then(db=>new Promise((res,rej)=>{const q=db.transaction('songs').objectStore('songs').getAll();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}))},
  add(rec){return IDB.open().then(db=>new Promise((res,rej)=>{const q=db.transaction('songs','readwrite').objectStore('songs').add(rec);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}))}
};
IDB.all().then(rows=>{rows.forEach(r=>{SAVED.add(r.key);PLAYLIST.push({t:r.name,f:URL.createObjectURL(r.blob)})});
  if(el('mp3')&&!el('mp3').hidden)ui()}).catch(()=>{});
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}

/* ---- el objeto: lo da el alumno del gimnasio ---- */
STORY.items.mp3=['Reproductor MP3','Un reproductor con auriculares. Ábrelo desde la Agenda.'];
const a=STORY.npcs.find(n=>n.id==='alumno5'),orig=a.talk;
a.talk=()=>G.inv.includes('mp3')?orig():[{n:'Alumno',t:'Eh, tú, nuevo. Encontré esto en el vestuario y yo ya tengo móvil.',opts:[
  {t:'¿Me lo das?',go:[{n:'Alumno',t:'Toma, es un reproductor MP3. Ábrelo desde la Agenda.',fx:()=>give('mp3')}]},
  {t:'No, gracias',go:[{n:'Alumno',t:'Tú te lo pierdes.'}]}]}];

/* ---- integración con la música del juego y la Agenda ---- */
const pm=playMusic;playMusic=p=>{if(!MP3.on)pm(p)};
const om=openMenu;
openMenu=()=>{om();if(!G.inv.includes('mp3'))return;
  const b=document.createElement('button');b.className='sq';b.textContent='Reproductor MP3';b.onclick=openP;
  const r=document.querySelector('#menuBody .row');r.insertBefore(b,r.lastElementChild)};

/* ---- controles ---- */
function play(i,back){
  if(!back&&MP3.on&&MP3.i!==i)MP3.hist.push(MP3.i);
  MP3.on=true;MP3.i=i;const f=PLAYLIST[i].f;
  music.loop=false;music.dataset.file=f;music.src=f;
  music.play().catch(()=>toast('No se encontró el archivo'));ui();
}
function next(){const n=PLAYLIST.length;let i=(MP3.i+1)%n;
  if(MP3.shuffle&&n>1)do{i=Math.random()*n|0}while(i===MP3.i);play(i)}
function prev(){if(music.currentTime>3){music.currentTime=0;return}
  const n=PLAYLIST.length;if(MP3.shuffle&&MP3.hist.length)play(MP3.hist.pop(),true);else play((MP3.i-1+n)%n,true)}
function toggle(){if(!MP3.on){play(MP3.i);return}music.paused?music.play():music.pause()}
function ambient(){MP3.on=false;music.loop=true;pm(G.map);ui();toast('Música del juego')}
const vol=d=>{music.volume=Math.max(0,Math.min(1,music.volume+d));toast('Volumen '+Math.round(music.volume*100)+'%')};
const mmss=s=>isFinite(s)?(s/60|0)+':'+String(s%60|0).padStart(2,'0'):'0:00';
music.addEventListener('ended',()=>{if(MP3.on)next()});
['play','pause','timeupdate','loadedmetadata'].forEach(e=>music.addEventListener(e,()=>{if(!el('mp3').hidden)ui()}));

/* ---- dibujo del reproductor ---- */
const css=document.createElement('style');
css.textContent=`
#mp3{position:fixed;inset:0;z-index:30;background:rgba(10,14,20,.8);display:grid;place-items:center;padding:12px}
.mpb{width:min(300px,94vw);background:linear-gradient(160deg,#d8dde4,#9aa4b2 55%,#c4cbd5);border:4px solid #2a1f14;border-radius:22px;padding:14px 14px 16px;box-shadow:0 8px 0 rgba(0,0,0,.5);color:#17202b;font-family:'Press Start 2P',monospace;max-height:96vh;overflow:auto}
.mpt{display:flex;justify-content:space-between;align-items:center;font-size:9px;margin-bottom:8px}
.mpb button{font-family:inherit;cursor:pointer}
.mpx{background:#c4423f;color:#f6f0dc;border:2px solid #2a1f14;font-size:9px;padding:4px 7px}
.mpl{background:#a9c28a;border:3px solid #2a3320;box-shadow:inset 0 0 0 2px #7f9a64;padding:8px;color:#1f2b17;font-size:8px;line-height:1.7;min-height:118px}
#mpTi{font-size:9px;min-height:30px;word-break:break-word}
.mpr{display:flex;justify-content:space-between;margin-top:4px}
#mpBar{height:10px;border:2px solid #1f2b17;margin-top:8px;cursor:pointer;background:#c5d9a9}
#mpFill{display:block;height:100%;width:0;background:#1f2b17}
#mpLs{max-height:104px;overflow:auto}
#mpLs button{display:block;width:100%;text-align:left;background:none;border:0;color:#1f2b17;font-size:8px;padding:3px 2px}
#mpLs button.on{background:#1f2b17;color:#a9c28a}
.whl{position:relative;width:190px;height:190px;margin:14px auto 8px;border-radius:50%;background:#eef0f3;border:4px solid #5f6b7a;box-shadow:inset 0 0 0 6px #d3d8de}
.whl button{position:absolute;background:none;border:0;color:#2a3140;font-size:10px;width:54px;height:40px}
.whl .c{left:62px;top:62px;width:66px;height:66px;border-radius:50%;background:#7a8696;color:#f6f0dc;border:3px solid #5f6b7a;font-size:14px}
.whl .u{left:68px;top:6px;width:54px}.whl .d{left:68px;top:144px;width:54px}
.whl .l{left:6px;top:75px}.whl .r{left:130px;top:75px}
.mpk{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.mpk button{background:#2a3140;color:#f2d45c;border:2px solid #17202b;font-size:8px;padding:6px 7px}
.mpk button.on{background:#f2d45c;color:#17202b}
`;
document.head.appendChild(css);
const box=document.createElement('div');box.id='mp3';box.hidden=true;
box.innerHTML=`<div class="mpb">
 <div class="mpt"><span>MP3 · HORIZONTE</span><button class="mpx" id="mpX" aria-label="Cerrar">X</button></div>
 <div class="mpl"><div id="mpMain"><div id="mpTi"></div><div id="mpBar"><i id="mpFill"></i></div><div class="mpr"><span id="mpT"></span><span id="mpM"></span></div></div><div id="mpLs" hidden></div></div>
 <div class="whl">
  <button class="u" id="mpL">LISTA</button><button class="l" id="mpP">&#9664;&#9664;</button><button class="r" id="mpN">&#9654;&#9654;</button><button class="d" id="mpS">MEZCLA</button><button class="c" id="mpC">&#9654;</button>
 </div>
 <div class="mpk"><button id="mpV1">VOL-</button><button id="mpV2">VOL+</button><button id="mpA">+ AÑADIR</button><button id="mpE">AMBIENTE</button></div>
 <input type="file" id="mpF" accept="audio/*" multiple hidden>
</div>`;
document.body.appendChild(box);

function ui(){
  const p=PLAYLIST[MP3.i],dur=music.duration;
  el('mpTi').textContent=MP3.on?'♪ '+p.t:'♪ Música del juego';
  el('mpT').textContent=MP3.on?mmss(music.currentTime)+' / '+mmss(dur):'--:--';
  el('mpM').textContent=MP3.shuffle?'ALEATORIO':'EN ORDEN';
  el('mpFill').style.width=MP3.on&&dur?(music.currentTime/dur*100)+'%':'0';
  el('mpC').innerHTML=MP3.on&&!music.paused?'II':'&#9654;';
  el('mpS').className=MP3.shuffle?'on':'';el('mpL').className=MP3.list?'on':'';
  el('mpMain').hidden=MP3.list;el('mpLs').hidden=!MP3.list;
  if(MP3.list)el('mpLs').innerHTML=PLAYLIST.map((s,i)=>`<button data-i="${i}" class="${MP3.on&&i===MP3.i?'on':''}">${i+1}. ${s.t}</button>`).join('');
}
function openP(){box.hidden=false;ui()}
function closeP(){box.hidden=true}
el('mpX').onclick=closeP;el('mpC').onclick=toggle;el('mpN').onclick=next;el('mpP').onclick=prev;
el('mpS').onclick=()=>{MP3.shuffle=!MP3.shuffle;toast(MP3.shuffle?'Modo aleatorio':'En orden');ui()};
el('mpL').onclick=()=>{MP3.list=!MP3.list;ui()};
el('mpLs').onclick=e=>{const b=e.target.closest('button');if(b)play(+b.dataset.i)};
el('mpV1').onclick=()=>vol(-.1);el('mpV2').onclick=()=>vol(.1);el('mpE').onclick=ambient;
el('mpBar').onclick=e=>{if(!MP3.on||!isFinite(music.duration))return;const r=e.currentTarget.getBoundingClientRect();music.currentTime=(e.clientX-r.left)/r.width*music.duration};
el('mpA').onclick=()=>el('mpF').click();
el('mpF').onchange=e=>{
  const files=[...e.target.files];let n=0;
  files.forEach(f=>{
    const key=f.name+'|'+f.size;if(SAVED.has(key))return;SAVED.add(key);n++;
    const name=f.name.replace(/\.[^.]+$/,'');
    PLAYLIST.push({t:name,f:URL.createObjectURL(f)});
    IDB.add({key,name,blob:f}).catch(()=>toast('No se pudo guardar '+f.name));
  });
  if(files.length)toast(n?'Canciones guardadas: '+n:'Esas canciones ya estaban');
  e.target.value='';ui()};
/* Esc / Tab / M cierran primero el reproductor, no la Agenda */
addEventListener('keydown',e=>{if(!box.hidden&&['Escape','Tab','m','M'].includes(e.key)){closeP();e.stopImmediatePropagation();e.preventDefault()}},true);
})();
