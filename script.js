
// ── NAV SCROLL ──
window.addEventListener('scroll',()=>{
  document.getElementById('main-nav').classList.toggle('lit',window.scrollY>80);
},{ passive:true });

// ── DATA ──
const CHS=[
  {id:1,title:"The Unseen Struggle",sub:"Understanding Keratoconus",
   ex:"Keratoconus is a silent deformer of sight — invisible to the naked eye, devastating in lived experience.",
   q:"In brokenness, I found my vision — not in sight, but in strength.",
   f:"Diagnosis typically takes years. Most patients are first told they simply need stronger glasses."},
  {id:2,title:"The Classroom Battle",sub:"Struggling in School",
   ex:"Blackboards became mysteries. Words blurred into one another. The classroom felt like enemy territory.",
   q:"My power is made perfect in weakness. — 2 Corinthians 12:9",
   f:"Academic decline from undiagnosed KC is often labelled as laziness or a learning disability."},
  {id:3,title:"A Heavy Burden",sub:"Financial & Emotional Costs",
   ex:"The diagnostic tests consumed the family's resources. Specialist fees. Travel. The invisible tax of chronic illness.",
   q:"Healing is as much about the heart as it is about the eyes.",
   f:"In Kenya, KC specialists are concentrated in Nairobi — making costs prohibitive for rural families."},
  {id:4,title:"A Fight for Sight",sub:"The Journey to Transplant",
   ex:"Preparing for a corneal transplant is a path of faith walked in near-total darkness.",
   q:"Your word is a lamp to my feet and a light to my path. — Psalm 119:105",
   f:"Corneal cross-linking, when performed early, can halt KC progression and prevent transplant."},
  {id:5,title:"The Road to Recovery",sub:"Living with a New Cornea",
   ex:"Recovery is not merely physical. It is a long, quiet renegotiation with who you are and what you can bear.",
   q:"When darkness clouds the eyes, light shines within the heart.",
   f:"Post-transplant patients require years of monitoring. Rejection can occur even a decade later."},
  {id:6,title:"Through New Eyes",sub:"Reflection and Life Beyond",
   ex:"This journey deepened my empathy beyond measure. To see clearly is to understand how precious the gift truly is.",
   q:"This journey is more than what the eye can see.",
   f:"Resilience is not the absence of pain — it is the decision to find purpose within it."}
];
const LVS=[
  {n:"New Reader",min:0,max:20},
  {n:"Active Explorer",min:20,max:50},
  {n:"Deep Diver",min:50,max:100},
  {n:"Warrior Scholar",min:100,max:150},
  {n:"Champion",min:150,max:999}
];

// ── STATE ──
let pts=parseInt(localStorage.getItem('kc3_pts')||'0');
let liked=new Set(JSON.parse(localStorage.getItem('kc3_liked')||'[]'));
let faved=new Set(JSON.parse(localStorage.getItem('kc3_faved')||'[]'));
let explored=new Set(JSON.parse(localStorage.getItem('kc3_explored')||'[]'));
let reviews=JSON.parse(localStorage.getItem('kc3_reviews')||'[]');
let badges=new Set(JSON.parse(localStorage.getItem('kc3_badges')||'[]'));
let votes=JSON.parse(localStorage.getItem('kc3_votes')||'{}');
let rval=0;
let submitting=false;

function save(){
  try{
    localStorage.setItem('kc3_pts',pts);
    localStorage.setItem('kc3_liked',JSON.stringify([...liked]));
    localStorage.setItem('kc3_faved',JSON.stringify([...faved]));
    localStorage.setItem('kc3_explored',JSON.stringify([...explored]));
    localStorage.setItem('kc3_reviews',JSON.stringify(reviews));
    localStorage.setItem('kc3_badges',JSON.stringify([...badges]));
    localStorage.setItem('kc3_votes',JSON.stringify(votes));
  }catch(e){}
}

function addPts(n,msg){
  pts+=n;
  toast('+'+n+' pts — '+msg,'fas fa-bolt');
  updateAll();save();
}

function updateAll(){
  // Points everywhere
  ['nav-pts','s-pts','lvl-pts'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.textContent=pts;
  });
  // Review count
  const srev=document.getElementById('s-rev');
  if(srev)srev.textContent=reviews.length;

  // Average rating
  if(reviews.length>0){
    const avg=(reviews.reduce((a,r)=>a+r.rating,0)/reviews.length).toFixed(1);
    const avgEl=document.getElementById('s-avg');
    if(avgEl)avgEl.textContent=avg+'★';
    const aggN=document.getElementById('agg-num');
    if(aggN)aggN.textContent=avg;
    const aggC=document.getElementById('agg-ct');
    if(aggC)aggC.textContent=reviews.length+' review'+(reviews.length===1?'':'s');
    const fl=Math.round(parseFloat(avg));
    document.querySelectorAll('#agg-stars i').forEach((s,i)=>s.classList.toggle('dim',i>=fl));
  } else {
    const aggN=document.getElementById('agg-num');
    if(aggN)aggN.textContent='—';
    const aggC=document.getElementById('agg-ct');
    if(aggC)aggC.textContent='No reviews yet';
    document.querySelectorAll('#agg-stars i').forEach(s=>s.classList.add('dim'));
  }

  // Level / XP
  let lv=LVS[0];
  for(const l of LVS){if(pts>=l.min)lv=l;}
  const nxtIdx=Math.min(LVS.indexOf(lv)+1,LVS.length-1);
  const nxt=LVS[nxtIdx];
  const rng=Math.max(lv.max-lv.min,1);
  const wi=Math.max(pts-lv.min,0);
  const pc=Math.min((wi/rng)*100,100);
  const lvNameEl=document.getElementById('lvl-name');
  if(lvNameEl)lvNameEl.textContent=lv.n.toUpperCase();
  const xpFg=document.getElementById('xp-fg');
  if(xpFg)xpFg.style.width=pc+'%';
  const xpFrom=document.getElementById('xp-from');
  if(xpFrom)xpFrom.textContent=lv.n;
  const xpTo=document.getElementById('xp-to');
  if(xpTo)xpTo.textContent=nxt.n;
  const xpNext=document.getElementById('xp-next');
  if(xpNext)xpNext.textContent=pts>=150?'Max level!':((nxt.min-pts)+' pts to next level');

  // Chapter progress
  const prog=Math.round((explored.size/CHS.length)*100);
  const pFg=document.getElementById('prog-fg');
  if(pFg)pFg.style.width=prog+'%';
  const pPct=document.getElementById('prog-pct');
  if(pPct)pPct.textContent=prog+'%';

  checkBadges();
}

function checkBadges(){
  if(reviews.length>=1) tryB('contributor','🖊 Contributor badge unlocked!');
  if(explored.size>=4)  tryB('super-reader','📖 Super Reader unlocked!');
  if(pts>=80)            tryB('warrior','🛡 KC Warrior unlocked!');
  if(pts>=150)           tryB('champion','👑 Champion unlocked!');
}

function tryB(id,msg){
  if(badges.has(id))return;
  badges.add(id);
  const el=document.getElementById('badge-'+id);
  if(el)el.classList.add('unlocked');
  toast(msg,'fas fa-award');
  confetti();
  save();
}
// Apply saved badges
badges.forEach(id=>{
  const el=document.getElementById('badge-'+id);
  if(el)el.classList.add('unlocked');
});

// ── BUILD CHAPTERS ──
const grid=document.getElementById('ch-grid');
CHS.forEach(ch=>{
  const card=document.createElement('div');
  card.className='ch-card'+(explored.has(ch.id)?' done':'');
  card.id='chc-'+ch.id;
  card.innerHTML=`
    <div class="ch-bignum">${String(ch.id).padStart(2,'0')}</div>
    <div class="ch-lbl">Chapter ${String(ch.id).padStart(2,'0')}</div>
    <div class="ch-title">${ch.title}</div>
    <div class="ch-sub">${ch.sub}</div>
    <div class="ch-excerpt">${ch.ex}</div>
    <div class="ch-insight" id="ins-${ch.id}">
      <div class="ins-q">"${ch.q}"</div>
      <div class="ins-f">${ch.f}</div>
    </div>
    <div class="ch-acts">
      <button class="ch-btn ${liked.has(ch.id)?'on-l':''}" data-action="like" data-id="${ch.id}">
        <i class="fas fa-heart"></i> <span class="btn-text-like">${liked.has(ch.id)?'Liked':'Like'}</span>
      </button>
      <button class="ch-btn ${faved.has(ch.id)?'on-f':''}" data-action="fav" data-id="${ch.id}" title="Bookmark">
        <i class="fas fa-bookmark"></i>
      </button>
      <button class="ch-btn ch-btn-ins" data-action="ins" data-id="${ch.id}">
        <i class="fas fa-eye"></i> <span class="btn-text-ins">${explored.has(ch.id)?'Hide':'Read Insight'}</span>
      </button>
    </div>`;
  grid.appendChild(card);
  if(explored.has(ch.id)){
    const insEl=document.getElementById('ins-'+ch.id);
    if(insEl)insEl.classList.add('open');
  }
});

// ── CHAPTER TOUCH DELEGATION ──
function handleChapterAction(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const action = btn.dataset.action;
  const id = parseInt(btn.dataset.id);
  
  switch (action) {
    case 'ins':
      doIns(id, btn);
      break;
    case 'like':
      doLike(id, btn);
      break;
    case 'fav':
      doFav(id, btn);
      break;
  }
}

function doIns(id, btnEl) {
  const p = document.getElementById('ins-' + id);
  const textEl = btnEl.querySelector('.btn-text-ins');
  const card = document.getElementById('chc-' + id);
  if (!p || !card) return;
  
  const wasOpen = p.classList.contains('open');
  p.classList.toggle('open');
  
  const isOpen = p.classList.contains('open');
  if (textEl) textEl.textContent = isOpen ? 'Hide' : 'Read Insight';
  
  if (isOpen && !explored.has(id)) {
    explored.add(id);
    card.classList.add('done');
    addPts(5, 'Chapter ' + id + ' explored');
  }
}

function doLike(id, btnEl) {
  if (liked.has(id)) {
    liked.delete(id);
    btnEl.classList.remove('on-l');
    const textEl = btnEl.querySelector('.btn-text-like');
    if (textEl) textEl.textContent = 'Like';
    toast('Like removed from Chapter ' + id, 'fas fa-heart-broken');
  } else {
    liked.add(id);
    btnEl.classList.add('on-l');
    const textEl = btnEl.querySelector('.btn-text-like');
    if (textEl) textEl.textContent = 'Liked';
    addPts(3, 'Liked Chapter ' + id);
  }
  save();
}

function doFav(id, btnEl) {
  if (faved.has(id)) {
    faved.delete(id);
    btnEl.classList.remove('on-f');
    toast('Removed bookmark from Chapter ' + id, 'fas fa-bookmark');
  } else {
    faved.add(id);
    btnEl.classList.add('on-f');
    addPts(4, 'Bookmarked Chapter ' + id);
  }
  save();
}

// Add event delegation after chapters built
document.getElementById('ch-grid').addEventListener('click', handleChapterAction);
document.getElementById('ch-grid').addEventListener('touchend', handleChapterAction);

// ── STAR RATING ──
const stars=document.querySelectorAll('.sstar');
stars.forEach(s=>{
  // Click
  s.addEventListener('click',()=>{
    rval=parseInt(s.dataset.v);
    document.getElementById('rev-rating').value=rval;
    stars.forEach((x,i)=>x.classList.toggle('on',i<rval));
  });
  // Touch support — same as click via touchend
  s.addEventListener('touchend',e=>{
    e.preventDefault();
    rval=parseInt(s.dataset.v);
    document.getElementById('rev-rating').value=rval;
    stars.forEach((x,i)=>x.classList.toggle('on',i<rval));
  });
  // Hover preview (desktop)
  s.addEventListener('mouseenter',()=>{
    const v=parseInt(s.dataset.v);
    stars.forEach((x,i)=>x.style.color=i<v?'var(--orange)':'');
  });
  s.addEventListener('mouseleave',()=>{
    stars.forEach(x=>x.style.color='');
  });
});

// ── CHAR COUNT ──
const revTxt=document.getElementById('rev-txt');
if(revTxt){
  revTxt.addEventListener('input',function(){
    document.getElementById('char-ct').textContent=this.value.length;
  });
}

// ── REVIEW FORM SUBMIT ──
document.getElementById('review-form').addEventListener('submit',function(e){
  e.preventDefault();
  if(submitting)return;

  const errEl=document.getElementById('form-error');
  const sucEl=document.getElementById('form-success');
  errEl.classList.remove('show');
  sucEl.classList.remove('show');

  const name=document.getElementById('inp-name').value.trim();
  const type=document.getElementById('inp-type').value;
  const text=(revTxt?revTxt.value.trim():'');
  const rating=parseInt(document.getElementById('rev-rating').value||'0');

  // Validate
  const errors=[];
  if(!name)errors.push('Your name is required.');
  if(!type)errors.push('Please select a format (Hard Copy / eBook).');
  if(!text||text.length<10)errors.push('Please write at least 10 characters in your review.');
  if(!rating||rating<1)errors.push('Please select a star rating (1–5).');

  if(errors.length){
    errEl.innerHTML=errors.map(e=>'• '+e).join('<br>');
    errEl.classList.add('show');
    errEl.scrollIntoView({behavior:'smooth',block:'nearest'});
    return;
  }

  // Disable button while submitting
  submitting=true;
  const btn=document.getElementById('btn-submit');
  if(btn){btn.textContent='SUBMITTING…';btn.style.opacity='.7';}

  // Simulate async (real app would POST to API here)
  setTimeout(()=>{
    reviews.unshift({
      name,type,review:text,rating,
      date:new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}),
      votes:0
    });
    save();
    renderRevs();
    this.reset();
    rval=0;
    stars.forEach(s=>s.classList.remove('on'));
    document.getElementById('rev-rating').value='';
    document.getElementById('char-ct').textContent='0';
    sucEl.classList.add('show');
    setTimeout(()=>sucEl.classList.remove('show'),4000);
    addPts(10,'Review submitted');
    checkBadges();
    submitting=false;
    if(btn){btn.textContent='SUBMIT REVIEW →';btn.style.opacity='1';}
  },600);
});

// ── RENDER REVIEWS ──
function renderRevs(){
  const f=document.getElementById('rev-feed');
  if(!f)return;
  if(!reviews.length){
    f.innerHTML='<div class="no-rev"><i class="fas fa-comment-dots"></i><p>No reviews yet. Be the first to share your thoughts on Victor\'s journey.</p></div>';
    return;
  }
  f.innerHTML=reviews.map((r,i)=>{
    const starsHTML=Array.from({length:5},(_,j)=>`<i class="fas fa-star${j<r.rating?'':' dim'}"></i>`).join('');
    const fmt=r.type==='hard-copy'?'📖 Hard Copy':'💻 eBook';
    const voted=votes[i];
    return `<div class="rcard">
      <div class="rcard-bq">"</div>
      <div class="rcard-top">
        <div class="rcard-name">${esc(r.name)}</div>
        <div class="rcard-meta">
          <span class="rcard-date">${r.date}</span>
          <span class="rcard-type">${fmt}</span>
        </div>
      </div>
      <div class="rcard-stars">${starsHTML}</div>
      <p class="rcard-txt">${esc(r.review)}</p>
      <div class="rcard-foot">
        <span class="rcard-hlp">Helpful?</span>
        <button class="rcard-vote${voted?' voted':''}" onclick="voteH(${i},this)" ${voted?'disabled':''}>
          <i class="fas fa-thumbs-up"></i> ${r.votes||0}
        </button>
      </div>
    </div>`;
  }).join('');
  updateAll();
}

function voteH(i,btn){
  if(votes[i])return;
  reviews[i].votes=(reviews[i].votes||0)+1;
  votes[i]=true;
  btn.classList.add('voted');
  btn.disabled=true;
  btn.innerHTML=`<i class="fas fa-thumbs-up"></i> ${reviews[i].votes}`;
  addPts(1,'Voted a review helpful');
  save();
}

function esc(s){
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ── IMAGE UPLOADS ──
function bindU(inId,imgId,lblId){
  const inp=document.getElementById(inId);
  const img=document.getElementById(imgId);
  if(!inp||!img)return;
  inp.addEventListener('change',function(){
    const f=this.files[0];
    if(!f)return;
    // Validate image type
    if(!f.type.startsWith('image/')){
      toast('Please select an image file','fas fa-triangle-exclamation');
      return;
    }
    const u=URL.createObjectURL(f);
    img.src=u;
    img.classList.add('vis');
    if(lblId){
      const lbl=document.getElementById(lblId);
      if(lbl)lbl.style.display='none';
    }
    toast('Image uploaded successfully!','fas fa-check');
  });
}
bindU('cu','cover-img','cover-lbl');
bindU('i1u','ti1',null);
bindU('i2u','ti2',null);
bindU('i3u','ti3',null);

// ── CONFETTI ──
function confetti(){
  const cv=document.getElementById('cvc');
  cv.width=innerWidth;cv.height=innerHeight;
  const ctx=cv.getContext('2d');
  const cols=['#E01A00','#FF6A00','#FF9500','#FF2800','#FFFFFF','#FFD700'];
  const ps=Array.from({length:100},()=>({
    x:Math.random()*innerWidth,y:-10,
    r:Math.random()*6+3,
    c:cols[Math.floor(Math.random()*cols.length)],
    vx:(Math.random()-.5)*3,vy:Math.random()*4+2,
    rot:Math.random()*360,vr:(Math.random()-.5)*6,
    sh:Math.random()>.5
  }));
  const t=Date.now();
  function draw(){
    ctx.clearRect(0,0,cv.width,cv.height);
    ps.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);
      ctx.fillStyle=p.c;
      if(p.sh){ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill();}
      else{ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);}
      ctx.restore();
    });
    if(Date.now()-t<3500)requestAnimationFrame(draw);
    else ctx.clearRect(0,0,cv.width,cv.height);
  }
  draw();
}

// ── TOAST ──
function toast(msg,icon='fas fa-info-circle'){
  const s=document.getElementById('toast-stack');
  if(!s)return;
  const el=document.createElement('div');
  el.className='toast';
  el.innerHTML=`<i class="${icon}"></i><span>${msg}</span>`;
  s.appendChild(el);
  setTimeout(()=>{
    if(el.parentNode)el.parentNode.removeChild(el);
  },3200);
}

// ── ROTATING QUOTES ──
const QUOTES=[
  "In brokenness, I found my vision — not in sight, but in <strong>strength</strong>.",
  "My power is made perfect in <strong>weakness</strong>. — 2 Corinthians 12:9",
  "Healing is as much about the <strong>heart</strong> as it is about the eyes.",
  "When darkness clouds the eyes, light shines <strong>within the heart</strong>.",
  "This journey is more than what <strong>the eye can see</strong>.",
  "Resilience is not the absence of pain — it is the decision to find <strong>purpose within it</strong>."
];
let qIdx=0;
const qEl=document.getElementById('rotating-quote');
const dotsEl=document.getElementById('quote-dots');
if(qEl&&dotsEl){
  qEl.style.transition='opacity .25s,transform .25s';
  QUOTES.forEach((_,i)=>{
    const d=document.createElement('button');
    d.className='qdot'+(i===0?' active':'');
    d.setAttribute('aria-label','Quote '+(i+1));
    d.addEventListener('click',()=>goQuote(i));
    dotsEl.appendChild(d);
  });
  function goQuote(i){
    qIdx=i;
    qEl.style.opacity='0';
    qEl.style.transform='translateY(8px)';
    setTimeout(()=>{
      qEl.innerHTML=QUOTES[i];
      qEl.style.opacity='1';
      qEl.style.transform='translateY(0)';
    },250);
    document.querySelectorAll('.qdot').forEach((d,j)=>d.classList.toggle('active',j===i));
  }
  setInterval(()=>goQuote((qIdx+1)%QUOTES.length),4500);
}

// ── SHARE FUNCTIONS ──
function getShareURL(){return encodeURIComponent(window.location.href);}
function getShareText(){return encodeURIComponent('I just discovered "Through the Lens of Keratoconus" by Victor M. Murega — a powerful memoir about faith, resilience, and sight. Check it out!');}

function shareWA(){
  window.open('https://wa.me/?text='+getShareText()+'%20'+getShareURL(),'_blank','noopener');
  addPts(2,'Shared on WhatsApp');
}
function shareFB(){
  window.open('https://www.facebook.com/sharer/sharer.php?u='+getShareURL(),'_blank','noopener');
  addPts(2,'Shared on Facebook');
}
function shareTW(){
  window.open('https://twitter.com/intent/tweet?text='+getShareText()+'&url='+getShareURL(),'_blank','noopener');
  addPts(2,'Shared on X/Twitter');
}
function shareTK(){
  window.open('https://www.tiktok.com/share?url='+getShareURL(),'_blank','noopener');
  addPts(2,'Shared on TikTok');
}
function shareIG(){
  // Instagram doesn't support direct URL sharing via web — guide user
  if(navigator.share){
    navigator.share({
      title:'Through the Lens of Keratoconus',
      text:'A powerful memoir by Victor M. Murega',
      url:window.location.href
    }).then(()=>addPts(2,'Shared via Instagram')).catch(()=>{});
  } else {
    copyLink(true);
    toast('Link copied! Paste it in your Instagram bio or story.','fab fa-instagram');
  }
}
function shareLI(){
  window.open('https://www.linkedin.com/sharing/share-offsite/?url='+getShareURL(),'_blank','noopener');
  addPts(2,'Shared on LinkedIn');
}
function copyLink(silent){
  const text=window.location.href;
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(()=>{
      if(!silent){
        const el=document.getElementById('share-copied');
        if(el){el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2800);}
        addPts(2,'Shared the book link');
      }
    }).catch(()=>fallbackCopy(text,silent));
  } else {
    fallbackCopy(text,silent);
  }
}
function fallbackCopy(text,silent){
  const ta=document.createElement('textarea');
  ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
  document.body.appendChild(ta);ta.focus();ta.select();
  try{document.execCommand('copy');}catch(e){}
  document.body.removeChild(ta);
  if(!silent){
    const el=document.getElementById('share-copied');
    if(el){el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2800);}
    addPts(2,'Shared the book link');
  }
}

// ── INIT ──
renderRevs();
updateAll();