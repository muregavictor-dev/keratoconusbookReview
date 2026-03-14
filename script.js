// ─── FIREBASE CONFIG ───
const firebaseConfig = {
    apiKey: "AIzaSyCJdh5Z2l16Bp9AMSMbrT9E0mqHCVaOhvA",
    authDomain: "book-database-e9665.firebaseapp.com",
    projectId: "book-database-e9665",
    storageBucket: "book-database-e9665.firebasestorage.app",
    messagingSenderId: "974555897450",
    appId: "1:974555897450:web:ae51b69fb6228bcf63f413",
    measurementId: "G-VDP2WX97XR"
  };

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
db.ref('reviews').on('value', snapshot => {
  const data = snapshot.val();
  if(!data) return;
  Object.keys(data).forEach(k => {
    const idx = parseInt(k.replace('review_',''),10);
    if(reviews[idx]){
      reviews[idx].votes = data[k].votes;
      const btn = document.querySelector(`.rcard-vote[data-idx="${idx}"]`);
      if(btn){
        btn.innerHTML = `<i class="fas fa-thumbs-up"></i> ${data[k].votes}`;
      }
    }
  });
});

// ─── NAV SCROLL ───
window.addEventListener('scroll',()=>{
  document.getElementById('main-nav').classList.toggle('lit',window.scrollY>80);
},{passive:true});

// ─── MODAL SYSTEM ───
function openModal(id){
  document.getElementById(id).classList.add('open');
  document.body.style.overflow='hidden';
}
function closeModal(id){
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow='';
}
// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay=>{
  overlay.addEventListener('click',function(e){
    if(e.target===this) closeModal(this.id);
  });
});
// Close on Escape
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    document.querySelectorAll('.modal-overlay.open').forEach(m=>closeModal(m.id));
  }
});

// ─── PDF PASSWORD GATE ───
// The PDF password is set here — Victor should change this after sharing with buyers
const PDF_PASSWORD = 'KC2025VICTOR';

function checkPDFPassword(){
  const input = document.getElementById('pdf-password-input');
  const errEl = document.getElementById('pdf-error');
  const sucEl = document.getElementById('pdf-success');
  errEl.classList.remove('show');
  sucEl.classList.remove('show');
  
  const val = (input.value||'').trim().toUpperCase();
  if(!val){
    errEl.textContent = 'Please enter your password.';
    errEl.classList.add('show');
    return;
  }
  if(val !== PDF_PASSWORD){
    errEl.textContent = 'Incorrect password. Please check the password sent to you on WhatsApp and try again.';
    errEl.classList.add('show');
    input.value='';
    input.focus();
    return;
  }
  // Correct password
  sucEl.classList.add('show');
  addPts(15, 'Unlocked the eBook!');
  toast('🎉 Welcome! Your PDF is ready.','fas fa-check-circle');
  
  // Trigger PDF download — link to the PDF file
  // Since we cannot host the PDF here, we open the WhatsApp to get the file link
  setTimeout(()=>{
    // Open WhatsApp with download request
    window.open('https://wa.me/254112127975?text=Hi%20Victor!%20I%20have%20entered%20the%20password%20and%20it%20worked.%20Please%20send%20me%20the%20PDF%20download%20link%20for%20%22Through%20the%20Lens%20of%20Keratoconus%22.','_blank','noopener');
    closeModal('modal-ebook');
  }, 2000);
}

// Allow Enter key in password input
document.getElementById('pdf-password-input').addEventListener('keydown',function(e){
  if(e.key==='Enter') checkPDFPassword();
});

// ─── LEVELS DATA ───
const LVS=[
  {n:"New Reader",min:0,max:20},
  {n:"Active Explorer",min:20,max:50},
  {n:"Deep Diver",min:50,max:100},
  {n:"Warrior Scholar",min:100,max:150},
  {n:"Champion",min:150,max:999}
];

// ─── STATE (localStorage) ───
function loadLS(key,def){
  try{const v=localStorage.getItem(key);return v!==null?JSON.parse(v):def;}catch(e){return def;}
}
function saveLS(key,val){
  try{localStorage.setItem(key,JSON.stringify(val));}catch(e){}
}

let pts    = loadLS('kc_pts',0);
let liked  = new Set(loadLS('kc_liked',[]));
let faved  = new Set(loadLS('kc_faved',[]));
let explored = new Set(loadLS('kc_explored',[]));
let reviews  = loadLS('kc_reviews',[]);
let badges   = new Set(loadLS('kc_badges',[]));
let votes    = loadLS('kc_votes',{});
let rval     = 0;
let submitting = false;

function save(){
  saveLS('kc_pts',pts);
  saveLS('kc_liked',[...liked]);
  saveLS('kc_faved',[...faved]);
  saveLS('kc_explored',[...explored]);
  saveLS('kc_reviews',reviews);
  saveLS('kc_badges',[...badges]);
  saveLS('kc_votes',votes);
}

function addPts(n,msg){
  pts+=n;
  toast('+'+n+' pts — '+msg,'fas fa-bolt');
  updateAll();
  save();
}

function updateAll(){
  // Points displays
  ['nav-pts','s-pts','lvl-pts'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.textContent=pts;
  });

  // Review stats
  const srev=document.getElementById('s-rev');
  if(srev) srev.textContent=reviews.length;

  if(reviews.length>0){
    const avg=(reviews.reduce((a,r)=>a+(r.rating||0),0)/reviews.length).toFixed(1);
    const avgEl=document.getElementById('s-avg');
    if(avgEl) avgEl.textContent=avg+'★';
    const aggN=document.getElementById('agg-num');
    if(aggN) aggN.textContent=avg;
    const aggC=document.getElementById('agg-ct');
    if(aggC) aggC.textContent=reviews.length+' review'+(reviews.length===1?'':'s');
    const fl=Math.round(parseFloat(avg));
    document.querySelectorAll('#agg-stars i').forEach((s,i)=>s.classList.toggle('dim',i>=fl));
  } else {
    const aggN=document.getElementById('agg-num');
    if(aggN) aggN.textContent='—';
    const aggC=document.getElementById('agg-ct');
    if(aggC) aggC.textContent='No reviews yet';
    document.querySelectorAll('#agg-stars i').forEach(s=>s.classList.add('dim'));
    const avgEl=document.getElementById('s-avg');
    if(avgEl) avgEl.textContent='—';
  }

  // Level / XP
  let lv=LVS[0];
  for(const l of LVS){ if(pts>=l.min) lv=l; }
  const nxtIdx=Math.min(LVS.indexOf(lv)+1,LVS.length-1);
  const nxt=LVS[nxtIdx];
  const rng=Math.max(lv.max-lv.min,1);
  const wi=Math.max(pts-lv.min,0);
  const pc=Math.min((wi/rng)*100,100);
  const lvNameEl=document.getElementById('lvl-name');
  if(lvNameEl) lvNameEl.textContent=lv.n.toUpperCase();
  const xpFg=document.getElementById('xp-fg');
  if(xpFg) xpFg.style.width=pc+'%';
  const xpFrom=document.getElementById('xp-from');
  if(xpFrom) xpFrom.textContent=lv.n;
  const xpTo=document.getElementById('xp-to');
  if(xpTo) xpTo.textContent=nxt.n;
  const xpNext=document.getElementById('xp-next');
  if(xpNext) xpNext.textContent=pts>=150?'Max level!':(nxt.min-pts)+' pts to next level';

  // Chapter progress
  const prog=explored.size>0?Math.round((explored.size/CHS.length)*100):0;
  const pFg=document.getElementById('prog-fg');
  if(pFg) pFg.style.width=prog+'%';
  const pPct=document.getElementById('prog-pct');
  if(pPct) pPct.textContent=prog+'%';

  checkBadges();
}

function checkBadges(){
  if(reviews.length>=1) tryBadge('contributor','🖊 Contributor badge unlocked!');
  if(explored.size>=4)  tryBadge('super-reader','📖 Super Reader unlocked!');
  if(pts>=80)           tryBadge('warrior','🛡 KC Warrior unlocked!');
  if(pts>=150)          tryBadge('champion','👑 Champion unlocked!');
}
function tryBadge(id,msg){
  if(badges.has(id)) return;
  badges.add(id);
  const el=document.getElementById('badge-'+id);
  if(el) el.classList.add('unlocked');
  toast(msg,'fas fa-award');
  confetti();
  save();
}

// Apply saved badges on load
badges.forEach(id=>{
  const el=document.getElementById('badge-'+id);
  if(el) el.classList.add('unlocked');
});

// ─── CHAPTER INTERACTIONS (hand-coded HTML chapters) ───
const CH_IDS=[1,2,3,4,5,6];

// Inject floating heart keyframe
(function(){
  const s=document.createElement('style');
  s.textContent='@keyframes floatHeart{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-70px) scale(1.8)}}';
  document.head.appendChild(s);
})();

// Restore saved states on load
CH_IDS.forEach(id=>{
  const card=document.getElementById('chc-'+id);
  if(!card) return;
  const likeBtn=card.querySelector('.ch-btn-like');
  const saveBtn=card.querySelector('.ch-btn-save');
  const insBtn =card.querySelector('.ch-btn-ins');
  const panel  =document.getElementById('ins-'+id);
  if(liked.has(id)&&likeBtn){
    likeBtn.classList.add('on-l');
    const t=likeBtn.querySelector('.like-txt');
    if(t) t.textContent='Liked';
  }
  if(faved.has(id)&&saveBtn){
    saveBtn.classList.add('on-f');
    const t=saveBtn.querySelector('.save-txt');
    if(t) t.textContent='Saved';
  }
  if(explored.has(id)){
    card.classList.add('done');
    if(panel) panel.classList.add('open');
    if(insBtn){
      insBtn.classList.add('is-open');
      const t=insBtn.querySelector('.ins-txt');
      if(t) t.textContent='Hide';
      const i=insBtn.querySelector('i');
      if(i) i.className='fas fa-eye-slash';
    }
  }
});

function spawnHeart(btn){
  const rect=btn.getBoundingClientRect();
  const el=document.createElement('span');
  el.textContent='❤';
  el.style.cssText=`position:fixed;left:${rect.left+rect.width/2-10}px;top:${rect.top-4}px;font-size:1.3rem;pointer-events:none;z-index:9999;animation:floatHeart 0.9s ease forwards;`;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),950);
}

function handleLike(btn){
  const id=parseInt(btn.dataset.id,10);
  const txt=btn.querySelector('.like-txt');
  if(liked.has(id)){
    liked.delete(id);
    btn.classList.remove('on-l','burst');
    if(txt) txt.textContent='Like';
    toast('Removed like from Chapter '+id,'fas fa-heart-broken');
  } else {
    liked.add(id);
    btn.classList.add('on-l');
    btn.classList.remove('burst');
    void btn.offsetWidth;
    btn.classList.add('burst');
    if(txt) txt.textContent='Liked';
    spawnHeart(btn);
    addPts(3,'Liked Chapter '+id);
  }
  save();
}

function handleSave(btn){
  const id=parseInt(btn.dataset.id,10);
  const txt=btn.querySelector('.save-txt');
  const ico=btn.querySelector('i');
  if(faved.has(id)){
    faved.delete(id);
    btn.classList.remove('on-f');
    if(txt) txt.textContent='Save';
    toast('Removed bookmark from Chapter '+id,'fas fa-bookmark');
  } else {
    faved.add(id);
    btn.classList.add('on-f');
    if(txt) txt.textContent='Saved';
    if(ico){ico.style.transform='translateY(-4px) scale(1.3)';setTimeout(()=>ico.style.transform='',350);}
    addPts(4,'Bookmarked Chapter '+id);
  }
  save();
}

function handleInsight(btn){
  const id=parseInt(btn.dataset.id,10);
  const panel=document.getElementById('ins-'+id);
  const card =document.getElementById('chc-'+id);
  const txt  =btn.querySelector('.ins-txt');
  const ico  =btn.querySelector('i');
  if(!panel) return;
  const opening=!panel.classList.contains('open');
  panel.classList.toggle('open',opening);
  btn.classList.toggle('is-open',opening);
  if(txt) txt.textContent=opening?'Hide':'Read Insight';
  if(ico) ico.className=opening?'fas fa-eye-slash':'fas fa-eye';
  if(opening&&!explored.has(id)){
    explored.add(id);
    if(card) card.classList.add('done');
    addPts(5,'Chapter '+id+' explored');
    save();
  }
}

// Single delegation on ch-grid
const chGrid=document.getElementById('ch-grid');
let _ty=0;
function chDispatch(e){
  const lb=e.target.closest('.ch-btn-like');
  const sb=e.target.closest('.ch-btn-save');
  const ib=e.target.closest('.ch-btn-ins');
  if(lb){e.preventDefault();handleLike(lb);}
  else if(sb){e.preventDefault();handleSave(sb);}
  else if(ib){e.preventDefault();handleInsight(ib);}
}
if(chGrid){
  chGrid.addEventListener('click',chDispatch);
  chGrid.addEventListener('touchstart',e=>{_ty=e.touches[0].clientY;},{passive:true});
  chGrid.addEventListener('touchend',e=>{
    if(Math.abs(e.changedTouches[0].clientY-_ty)<12) chDispatch(e);
  });
}

// ─── STAR RATING ───
const stars=document.querySelectorAll('.sstar');
stars.forEach(s=>{
  s.addEventListener('click',()=>setRating(parseInt(s.dataset.v,10)));
  s.addEventListener('touchend',e=>{e.preventDefault();setRating(parseInt(s.dataset.v,10));});
  s.addEventListener('mouseenter',()=>{
    const v=parseInt(s.dataset.v,10);
    stars.forEach((x,i)=>{x.style.color=i<v?'var(--orange)':'';});
  });
  s.addEventListener('mouseleave',()=>{stars.forEach(x=>{x.style.color='';});});
});
function setRating(v){
  rval=v;
  document.getElementById('rev-rating').value=v;
  stars.forEach((x,i)=>x.classList.toggle('on',i<v));
}

// ─── CHAR COUNT ───
const revTxt=document.getElementById('rev-txt');
if(revTxt){
  revTxt.addEventListener('input',function(){
    const el=document.getElementById('char-ct');
    if(el) el.textContent=this.value.length;
  });
}

// ─── REVIEW FORM SUBMIT ───
const reviewForm = document.getElementById('review-form');
if (reviewForm) {
  reviewForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (submitting) return;

    const errEl = document.getElementById('form-error');
    const sucEl = document.getElementById('form-success');
    errEl.classList.remove('show');
    sucEl.classList.remove('show');

    const name = (document.getElementById('inp-name').value || '').trim();
    const type = (document.getElementById('inp-type').value || '').trim();
    const text = revTxt ? (revTxt.value || '').trim() : '';
    const rating = parseInt(document.getElementById('rev-rating').value || '0', 10);

    const errors = [];
    if (!name) errors.push('Your name is required.');
    if (!type) errors.push('Please select a format (Hard Copy / eBook).');
    if (!text || text.length < 10) errors.push('Please write at least 10 characters in your review.');
    if (!rating || rating < 1) errors.push('Please select a star rating (1–5).');

    if (errors.length) {
      errEl.innerHTML = errors.map(e => '• ' + e).join('<br>');
      errEl.classList.add('show');
      errEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    submitting = true;
    const btn = document.getElementById('btn-submit');
    if (btn) {
      btn.textContent = 'SUBMITTING…';
      btn.style.opacity = '.7';
    }

    // Add review locally
    const newReview = {
      name,
      type,
      review: text,
      rating,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      votes: 0
    };
    reviews.unshift(newReview);
    save();
    renderRevs();
    addPts(10, 'Review submitted');

    // Submit to Formspree
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('type', type);
      formData.append('review', text);
      formData.append('rating', rating);

      const response = await fetch('https://formspree.io/f/xlgplvde', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        sucEl.classList.add('show');
        setTimeout(() => sucEl.classList.remove('show'), 4500);

        // Reset form
        reviewForm.reset();
        rval = 0;
        stars.forEach(s => s.classList.remove('on'));
        const cc = document.getElementById('char-ct');
        if (cc) cc.textContent = '0';
      } else {
        throw new Error('Formspree error: ' + response.statusText);
      }
    } catch (err) {
      console.error(err);
      errEl.textContent = 'Error submitting review. Please try again.';
      errEl.classList.add('show');
    } finally {
      submitting = false;
      if (btn) {
        btn.textContent = 'SUBMIT REVIEW →';
        btn.style.opacity = '1';
      }
    }
  });

    // Push review to Firebase
const newReview = {
  name,
  type,
  review: text,
  rating,
  date: new Date().toISOString()
};

db.ref('reviews').push(newReview)
  .then(() => {
    // Also keep it in local reviews for immediate rendering
    reviews.unshift({
      ...newReview,
      date: new Date(newReview.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}),
      votes:0
    });
    const formData = new FormData();
formData.append('name', name);
formData.append('type', type);
formData.append('review', text);
formData.append('rating', rating);

fetch('https://formspree.io/f/xlgplvde', {
  method: 'POST',
  body: formData,
  headers: { 'Accept': 'application/json' }
})
.then(res => {
  if(res.ok){
    console.log('Formspree email sent successfully!');
  } else {
    console.warn('Formspree error:', res.statusText);
  }
})
.catch(err => console.error('Formspree network error:', err));
    renderRevs();
    reviewForm.reset();
    rval=0;
    stars.forEach(s=>s.classList.remove('on'));
    const ri=document.getElementById('rev-rating');
    if(ri) ri.value='';
    const cc=document.getElementById('char-ct');
    if(cc) cc.textContent='0';
    sucEl.classList.add('show');
    setTimeout(()=>sucEl.classList.remove('show'),4500);
    addPts(10,'Review submitted');
    submitting=false;
    if(btn){btn.textContent='SUBMIT REVIEW →';btn.style.opacity='1';}
  })
  .catch(err=>{
    console.error('Firebase submit error:', err);
    errEl.textContent = 'Error submitting review. Please try again.';
    errEl.classList.add('show');
    submitting=false;
    if(btn){btn.textContent='SUBMIT REVIEW →';btn.style.opacity='1';}
  });
  });
}

// Listen for new reviews in real-time
db.ref('reviews').on('child_added', snapshot => {
  const r = snapshot.val();
  
  // Check if this review is already in our local array (by timestamp)
  if (!reviews.some(review => review.date === r.date && review.name === r.name)) {
    // Add to the top of the local reviews array
    reviews.unshift({
      ...r,
      date: new Date(r.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}),
      votes: 0
    });
    renderRevs();
  }
});

// ─── RENDER REVIEWS ───
function renderRevs(){
  const f=document.getElementById('rev-feed');
  if(!f) return;
  if(!reviews.length){
    f.innerHTML='<div class="no-rev"><i class="fas fa-comment-dots"></i><p>No reviews yet. Be the first to share your thoughts on Victor\'s journey.</p></div>';
    updateAll();
    return;
  }
  f.innerHTML=reviews.map((r,i)=>{
    const starsHTML=Array.from({length:5},(_,j)=>`<i class="fas fa-star${j<(r.rating||0)?'':' dim'}"></i>`).join('');
    const fmt=r.type==='hard-copy'?'📖 Hard Copy':'💻 eBook';
    const voted=votes[i];
    return `<div class="rcard">
      <div class="rcard-bq">"</div>
      <div class="rcard-top">
        <div class="rcard-name">${esc(r.name)}</div>
        <div class="rcard-meta">
          <span class="rcard-date">${r.date||''}</span>
          <span class="rcard-type">${fmt}</span>
        </div>
      </div>
      <div class="rcard-stars">${starsHTML}</div>
      <p class="rcard-txt">${esc(r.review)}</p>
      <div class="rcard-foot">
        <span class="rcard-hlp">Helpful?</span>
        <button type="button" class="rcard-vote${voted?' voted':''}" onclick="voteH(${i},this)"${voted?' disabled':''}>
          <i class="fas fa-thumbs-up"></i> ${r.votes||0}
        </button>
      </div>
    </div>`;
  }).join('');
  updateAll();
}

function voteH(i, btn){
  if(votes[i]) return;

  // Update local review object
  reviews[i].votes = (reviews[i].votes||0)+1;
  votes[i] = true;

  // Update Firebase
  const reviewId = `review_${i}`;
  db.ref('reviews/' + reviewId).update({ votes: reviews[i].votes })
    .then(() => console.log('Firebase vote updated'))
    .catch(err => console.error('Firebase vote error:', err));

  // Update UI
  btn.classList.add('voted');
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-thumbs-up"></i> ${reviews[i].votes}`;
  addPts(1,'Voted a review helpful');
  save();
}

function esc(s){
  return String(s||'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ─── IMAGE UPLOADS ───
function bindU(inId,imgId,lblId){
  const inp=document.getElementById(inId);
  const img=document.getElementById(imgId);
  if(!inp||!img) return;
  inp.addEventListener('change',function(){
    const f=this.files&&this.files[0];
    if(!f) return;
    if(!f.type.startsWith('image/')){
      toast('Please select an image file','fas fa-triangle-exclamation');
      return;
    }
    const u=URL.createObjectURL(f);
    img.src=u;
    img.classList.add('vis');
    if(lblId){
      const lbl=document.getElementById(lblId);
      if(lbl) lbl.style.display='none';
    }
    toast('Image uploaded!','fas fa-check');
  });
}
bindU('cu','cover-img','cover-lbl');
bindU('i1u','ti1',null);
bindU('i2u','ti2',null);
bindU('i3u','ti3',null);

// ─── CONFETTI ───
function confetti(){
  const cv=document.getElementById('cvc');
  if(!cv) return;
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
  const t0=Date.now();
  (function draw(){
    ctx.clearRect(0,0,cv.width,cv.height);
    ps.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);
      ctx.fillStyle=p.c;
      if(p.sh){ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill();}
      else{ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);}
      ctx.restore();
    });
    if(Date.now()-t0<3500) requestAnimationFrame(draw);
    else ctx.clearRect(0,0,cv.width,cv.height);
  })();
}

// ─── TOAST ───
function toast(msg,icon='fas fa-info-circle'){
  const s=document.getElementById('toast-stack');
  if(!s) return;
  const el=document.createElement('div');
  el.className='toast';
  el.innerHTML=`<i class="${icon}"></i><span>${msg}</span>`;
  s.appendChild(el);
  setTimeout(()=>{if(el.parentNode)el.parentNode.removeChild(el);},3200);
}

// ─── ROTATING QUOTES ───
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
    d.type='button';
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

// ─── SHARE ───
function getShareURL(){return encodeURIComponent(window.location.href);}
function getShareText(){return encodeURIComponent('I just discovered "Through the Lens of Keratoconus" by Victor M. Murega — a powerful memoir about faith, resilience, and sight. Check it out!');}
function shareWA(){window.open('https://wa.me/?text='+getShareText()+'%20'+getShareURL(),'_blank','noopener');addPts(2,'Shared on WhatsApp');}
function shareFB(){window.open('https://www.facebook.com/sharer/sharer.php?u='+getShareURL(),'_blank','noopener');addPts(2,'Shared on Facebook');}
function shareTW(){window.open('https://twitter.com/intent/tweet?text='+getShareText()+'&url='+getShareURL(),'_blank','noopener');addPts(2,'Shared on X/Twitter');}
function shareTK(){window.open('https://www.tiktok.com/share?url='+getShareURL(),'_blank','noopener');addPts(2,'Shared on TikTok');}
function shareIG(){
  if(navigator.share){navigator.share({title:'Through the Lens of Keratoconus',text:'A powerful memoir by Victor M. Murega',url:window.location.href}).then(()=>addPts(2,'Shared')).catch(()=>{});}
  else{copyLink(true);toast('Link copied! Paste it in your Instagram story.','fab fa-instagram');}
}
function shareLI(){window.open('https://www.linkedin.com/sharing/share-offsite/?url='+getShareURL(),'_blank','noopener');addPts(2,'Shared on LinkedIn');}
function copyLink(silent){
  const text=window.location.href;
  function done(){
    if(!silent){
      const el=document.getElementById('share-copied');
      if(el){el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2800);}
      addPts(2,'Copied book link');
    }
  }
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(()=>fallbackCopy(text,done));
  } else {
    fallbackCopy(text,done);
  }
}
function fallbackCopy(text,cb){
  const ta=document.createElement('textarea');
  ta.value=text;ta.style.cssText='position:fixed;opacity:0;';
  document.body.appendChild(ta);ta.focus();ta.select();
  try{document.execCommand('copy');}catch(e){}
  document.body.removeChild(ta);
  if(cb) cb();
}

// ─── INIT ───
renderRevs();
updateAll();

// ─── LOAD REVIEWS FROM FIREBASE ───
db.ref('reviews').once('value')
  .then(snapshot => {
    const data = snapshot.val();
    if(!data) return;

    // Reset local reviews array
    reviews = [];

    // Convert Firebase object to array
    Object.values(data).forEach(r => {
      reviews.push({
        name: r.name,
        type: r.type,
        review: r.review,
        rating: r.rating,
        date: new Date(r.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}),
        votes: 0  // optional, you can add vote logic later
      });
    });

    // Render reviews
    renderRevs();
  })
  .catch(err => console.error('Firebase load error:', err));

// Animate progress bars on scroll
const observer=new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      updateAll();
      observer.unobserve(entry.target);
    }
  });
},{threshold:0.2});
const _pFg=document.getElementById('prog-fg');
if(_pFg) observer.observe(_pFg);
const _xFg=document.getElementById('xp-fg');
if(_xFg) observer.observe(_xFg);
