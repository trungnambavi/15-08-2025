function startBirthdayMatrix({ canvasId = 'birthdayCanvas', onFinished = () => {} } = {}) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');

  let W, H, DPR;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1);
    W = canvas.width = Math.floor(window.innerWidth * DPR);
    H = canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(DPR, DPR);
  }
  resize(); window.addEventListener('resize', resize);

  const TEXTS = [
    '15-8-2006 💖',
    'Chúc em luôn xinh đẹp hihi',
    'và hạnh phúc nhé🌸',
    'Ước gì được nấy nhé🎂✨',
    'Còn nữa đợi xíu'
  ];
  const FONT = "600 100px 'Avenir','Helvetica Neue',Arial,sans-serif";
  const SAMPLE_GAP = 6, MAX_PARTICLES = 2600;
  const BALLOON_COUNT = 15, CAKE_FLOAT_COUNT = 10;

  class Particle {
    constructor(){ this.alive=false; this.friction=0.85; }
    spawn(x,y,color){
      this.x=Math.random()*W; this.y=Math.random()*H;
      this.tx=x; this.ty=y;
      this.vx=(Math.random()-0.5)*6; this.vy=(Math.random()-0.5)*6;
      this.color=color || `hsl(${(Math.random()*360)|0},70%,60%)`; this.alive=true;
      this.size=1.8;
    }
    update(){
      const ax=(this.tx-this.x)*0.08, ay=(this.ty-this.y)*0.08;
      this.vx=(this.vx+ax)*this.friction; this.vy=(this.vy+ay)*this.friction;
      this.x+=this.vx; this.y+=this.vy;
    }
    draw(){
      ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
      ctx.fillStyle=this.color; ctx.fill();
    }
  }
  const pool=[], particles=[];
  for(let i=0;i<MAX_PARTICLES;i++) pool.push(new Particle());
  const alloc=()=>pool.pop()||null, free=p=>{p.alive=false; pool.push(p);};

  function applyTargets(targets){
    const needed=Math.min(targets.length,MAX_PARTICLES);
    while(particles.length>needed) free(particles.pop());
    for(let i=particles.length;i<needed;i++){ const p=alloc(); if(!p) break; particles.push(p); }
    for(let i=0;i<needed;i++){
      const t=targets[i]; particles[i].spawn(t.x,t.y,t.color);
    }
  }
  function setTargetsFromText(text){
    const off=document.createElement('canvas'), octx=off.getContext('2d');
    off.width=W; off.height=H; octx.scale(DPR,DPR);
    octx.fillStyle='rgba(255,255,255,1)'; octx.textAlign='center'; octx.textBaseline='middle';
    octx.font=FONT; octx.shadowColor='rgba(255,182,193,0.9)'; octx.shadowBlur=12;
    octx.fillText(text, W/(2*DPR), (H/(2*DPR)) + 150);
    const img=octx.getImageData(0,0,off.width,off.height).data;
    const targets=[];
    for(let y=0;y<H;y+=SAMPLE_GAP){
      for(let x=0;x<W;x+=SAMPLE_GAP){
        const idx=(y*W+x)*4;
        if(img[idx+3]>160) targets.push({x,y});
      }
    }
    applyTargets(targets);
  }
  function setTargetsFromCakeImage(img){
    const off=document.createElement('canvas'), octx=off.getContext('2d');
    off.width=W; off.height=H;
    const maxW=W/DPR*0.45, maxH=H/DPR*0.45;
    const ratio=Math.min(maxW/img.width, maxH/img.height, 1);
    const w=img.width*ratio, h=img.height*ratio;
    octx.drawImage(img, (W/DPR-w)/2, (H/DPR-h)/2, w, h);
    const data=octx.getImageData(0,0,off.width,off.height).data;
    const targets=[];
    for(let y=0;y<H;y+=SAMPLE_GAP){
      for(let x=0;x<W;x+=SAMPLE_GAP){
        const idx=(y*W+x)*4;
        if(data[idx+3]>150){
          targets.push({x,y,color:`rgb(${data[idx]},${data[idx+1]},${data[idx+2]})`});
        }
      }
    }
    applyTargets(targets);
  }

  const floaters=[];
  function spawnBalloon(){ return {type:'balloon',x:Math.random()*innerWidth,y:innerHeight+200,r:18+Math.random()*10,
    vx:(Math.random()-0.5)*0.4,vy:-(0.6+Math.random()*0.8),hue:(300+Math.random()*120)|0,
    wob:Math.random()*Math.PI*2,wobAmp:10+Math.random()*12}; }
  function spawnMiniCake(){ return {type:'cake',x:Math.random()*innerWidth,y:innerHeight+200,size:18+Math.random()*10,
    vx:(Math.random()-0.5)*0.3,vy:-(0.5+Math.random()*0.7),rot:Math.random()*Math.PI*2,vr:(Math.random()-0.5)*0.01}; }
  for(let i=0;i<BALLOON_COUNT;i++) floaters.push(spawnBalloon());
  for(let i=0;i<CAKE_FLOAT_COUNT;i++) floaters.push(spawnMiniCake());

  function drawBalloon(f,t){
    const x=f.x+Math.sin(t*0.002+f.wob)*f.wobAmp, y=f.y;
    ctx.save(); ctx.translate(x,y);
    ctx.strokeStyle='rgba(150,150,150,0.7)'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,22); ctx.stroke();
    const grd=ctx.createRadialGradient(-6,-6,2,0,0,f.r*1.4);
    grd.addColorStop(0,`hsla(${f.hue},90%,95%,0.95)`); grd.addColorStop(1,`hsla(${f.hue},70%,60%,0.9)`);
    ctx.fillStyle=grd; ctx.beginPath(); ctx.ellipse(0,-f.r,f.r*0.85,f.r*1.1,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  function drawMiniCake(f){
    ctx.save(); ctx.translate(f.x,f.y); ctx.rotate(f.rot);
    ctx.font='20px system-ui, emoji'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('🎂',0,0); ctx.restore();
  }
  function updateFloaters(){
    const t=performance.now();
    for(let i=0;i<floaters.length;i++){
      const f=floaters[i];
      f.x+=f.vx; f.y+=f.vy; if(f.type==='cake') f.rot+=f.vr;
      if(f.y<-60||f.x<-80||f.x>innerWidth+80) floaters[i]=(f.type==='balloon')?spawnBalloon():spawnMiniCake();
      if(f.type==='balloon') drawBalloon(f,t); else drawMiniCake(f);
    }
  }

  function loop(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    updateFloaters();
    for(const p of particles) if(p.alive){ p.update(); p.draw(); }
    requestAnimationFrame(loop);
  }

  function svgCakeImage(){
    const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='320'> ... </svg>`;
    const img=new Image(); img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    return img;
  }
  const cakeImg=svgCakeImage();

  async function runSequence(){
    for(const t of TEXTS){ setTargetsFromText(t); await wait(2600); await wait(900); }
    await new Promise(res=>{ cakeImg.onload=res; if(cakeImg.complete) res(); });
    setTargetsFromCakeImage(cakeImg); await wait(2500);
    onFinished();
  }
  const wait=ms=>new Promise(r=>setTimeout(r,ms));

  loop(); runSequence();
}
