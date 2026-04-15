import { TAG_META } from './data.js?v=14';
const supabase = window.supabase.createClient('https://panktkmwgcttjpebucqy.supabase.co', 'sb_publishable_tuwGL-r9XQO7mlC6FPOVdQ_35XHkEa1');
function toCreator(r){ return { id:r.id, userId:r.user_id, name:r.name, initials:r.initials, primaryTag:r.primary_tag, lat:r.lat, lng:r.lng, location:r.location, rating:r.rating, reviewCount:r.review_count, tags:r.tags||[], bio:r.bio, gear:r.gear||[], rates:{halfDay:r.half_day_rate,fullDay:r.full_day_rate}, schedule:r.schedule||[true,true,true,true,true,true,true], isLive:r.is_live, showRates:r.show_rates, avatarUrl:r.avatar_url||null, instagramHandle:r.instagram_handle||null, availableNow:r.available_now||false, availableUntil:r.available_until||null, viewCount:r.view_count||0, portfolioPhotos:r.portfolio_photos||[] }; }
function isAvailNow(c){ return !!(c.availableNow && c.availableUntil && new Date(c.availableUntil)>new Date()); }
let creators = [];
const SHUTTER_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScf520qHkbI_0RynCAsm3aEb_ab3Sr6B4aQ7-ESJtARPdWgmw/viewform';
const MAPBOX_TOKEN = 'pk.eyJ1IjoieXVucGF0cmljazMyIiwiYSI6ImNtbXF6ejN3NDE3Z2kyc3E0a3I1OWJyazYifQ.s6YwV4WG5fbB0ULZjXPncw';
const LAKE_TAHOE = [-120.0324, 39.0968];
let activeFilter = 'all', selectedId = null, markerMap = {}, activeCreator = null;
let currentUser = null, userProfile = null;
const myProfile = { name:'Patrick Yun', initials:'PY', location:'Truckee, CA', primaryTag:'snowboard', tags:['snowboard','video','off-road'], bio:'Snowboard filmer and content creator based in Truckee. Off-road capable — no location too remote.', gear:['Sony FX3','DJI RS3 gimbal','Premiere Pro','Tacoma TRD — off-road'], rates:{halfDay:400,fullDay:700}, showRates:false, portfolioUrl:'', stats:{views:12,inquiries:3,earnings:1100} };
mapboxgl.accessToken = MAPBOX_TOKEN;
const map = new mapboxgl.Map({ container:'map', style:'mapbox://styles/mapbox/dark-v11', center:LAKE_TAHOE, zoom:10.5, pitch:50, bearing:-10, antialias:true });
map.addControl(new mapboxgl.NavigationControl({showCompass:false}),'top-right');
async function fetchAndRender(){ if(fetchAndRender._running)return; fetchAndRender._running=true; const {data,error}=await supabase.from('profiles').select('*').eq('is_live',true); fetchAndRender._running=false; if(error){console.error('Supabase error:',error);return;} creators=(data||[]).map(toCreator); const now=new Date(); creators.forEach(c=>{if(c.availableNow&&c.availableUntil&&new Date(c.availableUntil)<=now)c.availableNow=false;}); if(userProfile){const me=creators.find(c=>c.id===userProfile.id);if(me&&!me.availableNow&&userProfile.availableNow){supabase.from('profiles').update({available_now:false,available_until:null}).eq('id',userProfile.id).catch(()=>{});userProfile.availableNow=false;userProfile.availableUntil=null;}} const filtered=activeFilter==='all'?creators:creators.filter(c=>c.tags.includes(activeFilter)); renderMarkers(filtered); }
function setupTerrain(){ if(map.getSource('mapbox-dem'))return; map.addSource('mapbox-dem',{type:'raster-dem',url:'mapbox://mapbox.mapbox-terrain-dem-v1',tileSize:512,maxzoom:14}); map.setTerrain({source:'mapbox-dem',exaggeration:1.4}); map.setFog({color:'rgb(180,205,230)','high-color':'rgb(30,80,200)','horizon-blend':0.015,'space-color':'rgb(8,8,20)','star-intensity':0.7}); }
map.on('load',()=>{ setupTerrain(); fetchAndRender(); });
map.on('style.load',()=>{ setupTerrain(); if(!creators.length)fetchAndRender(); });
async function initAuth(){ const {data:{session}}=await supabase.auth.getSession(); if(session?.user)await handleSignIn(session.user); supabase.auth.onAuthStateChange(async(event,session)=>{ if(event==='SIGNED_IN'&&session?.user){await handleSignIn(session.user);closeLoginModal();} else if(event==='SIGNED_OUT'){currentUser=null;userProfile=null;updateProfileBtn();updateNotifBadge();} }); }
async function handleSignIn(user){ currentUser=user; const {data}=await supabase.from('profiles').select('*').eq('user_id',user.id).maybeSingle(); userProfile=data?toCreator(data):null; updateProfileBtn(); updateNotifBadge(); if(!userProfile){ setTimeout(()=>{ closeLoginModal(); openJoin(); },500); } else { closeLoginModal(); } }
function updateProfileBtn(){ const btn=document.getElementById('profile-btn'); if(currentUser){btn.style.background='rgba(129,140,248,.15)';btn.style.borderColor='rgba(129,140,248,.4)';btn.style.color='#818cf8';}else{btn.style.background='';btn.style.borderColor='';btn.style.color='';} const joinBtn=document.getElementById('join-btn'); if(userProfile){joinBtn.style.display='none';}else{joinBtn.style.display='';} }
function openLoginModal(){ document.getElementById('login-email').value=''; document.getElementById('login-sent').style.display='none'; const btn=document.getElementById('login-send');btn.disabled=false;btn.textContent='Send me a login link'; document.getElementById('login-modal').classList.add('open'); }
function closeLoginModal(){ document.getElementById('login-modal').classList.remove('open'); }
async function signInWithGoogle(){ await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:'https://shutter-app.netlify.app'}}); }
async function sendMagicLink(){ const email=document.getElementById('login-email').value.trim(); if(!email){showToast('Enter your email','#ef4444');return;} const btn=document.getElementById('login-send');btn.disabled=true;btn.textContent='Sending…'; const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:'https://shutter-app.netlify.app'}}); if(error){btn.disabled=false;btn.textContent='Send me a login link';showToast('Error sending link','#ef4444');return;} document.getElementById('login-sent').style.display='block'; }

function closeAllPanels(){ document.getElementById('profile-card').classList.remove('open'); document.getElementById('join-panel').classList.remove('open'); document.getElementById('my-profile-panel').classList.remove('open'); document.getElementById('booking-panel').classList.remove('open'); document.getElementById('messages-panel').classList.remove('open'); document.getElementById('chat-panel').classList.remove('open'); document.getElementById('overlay').classList.remove('active'); Object.values(markerMap).forEach(({el})=>el.classList.remove('active')); selectedId=null; }
map.on('click',()=>closeCard());
function createPinEl(creator){ const meta=TAG_META[creator.primaryTag]; const el=document.createElement('div'); el.className='shutter-pin'; el.dataset.id=creator.id; const av=creator.schedule[0]; const photoStyle=creator.avatarUrl?`background-image:url(${creator.avatarUrl});background-size:cover;background-position:center;`:'';
  const initialsHtml=creator.avatarUrl?'':`<span class="pin-initials">${creator.initials}</span>`;
  el.innerHTML=`<div class="pin-ring${isAvailNow(creator)?' pin-avail-now':''}" style="--ring:${meta.color};--bg:${meta.bg};${photoStyle}">${initialsHtml}<span class="pin-avail ${av?'avail-yes':'avail-no'}"></span></div><span class="pin-label" style="color:${meta.color}">${creator.primaryTag}</span>`; el.addEventListener('click',e=>{e.stopPropagation();openCard(creator);}); return el; }
function renderMarkers(list){ Object.values(markerMap).forEach(({marker})=>marker.remove()); markerMap={}; list.forEach(c=>{const el=createPinEl(c);const marker=new mapboxgl.Marker({element:el,anchor:'bottom'}).setLngLat([c.lng,c.lat]).addTo(map);markerMap[c.id]={marker,el};}); document.getElementById('creator-count').textContent=`${list.length} creator${list.length!==1?'s':''}`; }
const DAY_ABBR=['SUN','MON','TUE','WED','THU','FRI','SAT'];
function openCard(creator){ closeAllPanels(); selectedId=creator.id; activeCreator=creator; const meta=TAG_META[creator.primaryTag]; const av=creator.schedule[0]; Object.entries(markerMap).forEach(([id,{el}])=>el.classList.toggle('active',Number(id)===creator.id||id===creator.id)); const avatar=document.getElementById('card-avatar'); if(creator.avatarUrl){avatar.textContent='';avatar.style.cssText=`background:${meta.bg};border-color:${meta.color};background-image:url(${creator.avatarUrl});background-size:cover;background-position:center;`;}else{avatar.textContent=creator.initials;avatar.style.cssText=`background:${meta.bg};border-color:${meta.color};color:${meta.color};`; } document.getElementById('card-name').textContent=creator.name; const verBadge=document.getElementById('card-verified'); if(creator.instagramHandle){verBadge.style.display='inline-flex';}else{verBadge.style.display='none';} const igEl=document.getElementById('card-instagram'); if(creator.instagramHandle){igEl.innerHTML=`<a href="https://instagram.com/${encodeURIComponent(creator.instagramHandle)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;font-size:0.8rem;color:#818cf8;text-decoration:none;">📸 @${escapeHtml(creator.instagramHandle)}</a>`;igEl.style.display='block';}else{igEl.style.display='none';} document.getElementById('card-location').textContent=`📍 ${creator.location}`; const filled=Math.round(creator.rating); document.getElementById('card-rating').innerHTML=`<span style="color:${meta.color}">${'★'.repeat(filled)}${'☆'.repeat(5-filled)}</span> <span style="color:#6b7280;font-size:0.75rem">${creator.rating} (${creator.reviewCount} reviews)</span>`; document.getElementById('card-tags').innerHTML=creator.tags.map(t=>{const m=TAG_META[t];return`<span class="tag-chip" style="background:${m.color}18;color:${m.color};border-color:${m.color}40">${m.label}</span>`;}).join(''); document.getElementById('card-bio').textContent=creator.bio; document.getElementById('card-gear').innerHTML=creator.gear.map(g=>`<li class="gear-item"><span class="gear-dot">▸</span>${g}</li>`).join(''); const effectiveShowRates=creator.showRates; if(effectiveShowRates){document.getElementById('card-rates').innerHTML=[{label:'Half Day',val:`$${creator.rates.halfDay}`},{label:'Full Day',val:`$${creator.rates.fullDay}`},{label:'Custom',val:'On request'}].map(r=>`<div class="rate-box"><div class="rate-val">${r.val}</div><div class="rate-label">${r.label}</div></div>`).join('');document.getElementById('card-rates').style.display='flex';document.getElementById('card-rates-hidden').style.display='none';}else{document.getElementById('card-rates').style.display='none';document.getElementById('card-rates-hidden').style.display='flex';} const portUrl=creator.portfolioUrl; const portWrap=document.getElementById('card-portfolio-wrap'); if(portUrl){document.getElementById('card-portfolio-link').href=portUrl;portWrap.style.display='block';}else{portWrap.style.display='none';} const badge=document.getElementById('card-avail-badge'); if(isAvailNow(creator)){badge.classList.add('visible');}else{badge.classList.remove('visible');} const today=new Date(); document.getElementById('card-avail-grid').innerHTML=creator.schedule.map((open,i)=>{const d=new Date(today);d.setDate(today.getDate()+i);const label=i===0?'TODAY':DAY_ABBR[d.getDay()];return`<div class="avail-cell ${open?'avail-open':'avail-busy'} ${i===0?'avail-today':''}"><span class="avail-dname">${label}</span><span class="avail-dnum">${d.getDate()}</span><span class="avail-dot"></span></div>`;}).join(''); const bookBtn=document.getElementById('btn-book'); bookBtn.textContent=av?'Book Now':'Request Booking'; bookBtn.style.background=av?'#16a34a':'#374151'; renderCardPortfolioGrid(creator); document.getElementById('profile-card').classList.add('open'); document.getElementById('overlay').classList.add('active'); map.flyTo({center:[creator.lng,creator.lat],zoom:Math.max(map.getZoom(),11.5),pitch:52,duration:900,offset:[0,-120],essential:true}); if(creator.id)supabase.rpc('increment_view_count',{profile_id:creator.id}).catch(()=>{}); }
function closeCard(){ selectedId=null; document.getElementById('profile-card').classList.remove('open'); document.getElementById('overlay').classList.remove('active'); Object.values(markerMap).forEach(({el})=>el.classList.remove('active')); }
function openBooking(){ if(!activeCreator)return; closeAllPanels(); const meta=TAG_META[activeCreator.primaryTag]; const ba=document.getElementById('booking-avatar'); ba.textContent=activeCreator.initials; ba.style.background=meta.bg; ba.style.borderColor=meta.color; ba.style.color=meta.color; document.getElementById('booking-name').textContent=activeCreator.name; document.getElementById('booking-location').textContent=activeCreator.location; document.getElementById('booking-type').value='snowboard'; document.getElementById('booking-date').value=''; document.getElementById('booking-notes').value=''; document.querySelectorAll('.deliverable-check').forEach(cb=>cb.checked=false); setDuration('half'); document.getElementById('booking-panel').classList.add('open'); }
function closeBooking(){ document.getElementById('booking-panel').classList.remove('open'); }
function setDuration(type){ document.querySelectorAll('.dur-btn').forEach(b=>{const active=b.dataset.type===type; b.style.background=active?'#818cf818':'#1f2937'; b.style.borderColor=active?'#818cf8':'#374151'; b.style.color=active?'#818cf8':'#9ca3af'; b.style.fontWeight=active?'600':'400';}); const price=type==='half'?activeCreator?.rates?.halfDay:type==='full'?activeCreator?.rates?.fullDay:null; document.getElementById('price-label').textContent=type==='half'?'Half day':type==='full'?'Full day':'Multi-day'; document.getElementById('price-amount').textContent=price?`${price}`:'Custom quote'; }

// ─── MESSAGING (Supabase) ────────────────────────────────────────────────────

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function formatMsgTime(ts){
  if(!ts)return '';
  const d=new Date(ts), diff=Date.now()-d;
  if(diff<3600000)return `${Math.max(1,Math.floor(diff/60000))}m ago`;
  if(diff<86400000)return `${Math.floor(diff/3600000)}h ago`;
  if(diff<172800000)return 'Yesterday';
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

async function fetchAndOpenMessages(){
  if(!currentUser){openLoginModal();return;}
  closeAllPanels();
  document.getElementById('messages-panel').classList.add('open');
  const list=document.getElementById('messages-list');
  list.innerHTML='<div style="padding:24px;color:#6b7280;text-align:center;font-size:.85rem;">Loading…</div>';

  // Fetch messages sent by me and received by my profile in parallel
  const [sentRes, receivedRes]=await Promise.all([
    supabase.from('messages').select('*').eq('sender_id',currentUser.id).order('created_at',{ascending:false}),
    userProfile
      ? supabase.from('messages').select('*').eq('recipient_profile_id',userProfile.id).order('created_at',{ascending:false})
      : Promise.resolve({data:[]})
  ]);
  const sent=sentRes.data||[], received=receivedRes.data||[];

  // Look up sender profiles for received messages
  const senderAuthIds=[...new Set(received.map(m=>m.sender_id))];
  let senderMap={};
  if(senderAuthIds.length){
    const{data:sp}=await supabase.from('profiles').select('id,name,initials,primary_tag,user_id').in('user_id',senderAuthIds);
    (sp||[]).forEach(p=>{senderMap[p.user_id]=p;});
  }

  // Look up recipient profiles for sent messages
  const recipIds=[...new Set(sent.map(m=>m.recipient_profile_id).filter(Boolean))];
  let recipMap={};
  if(recipIds.length){
    const{data:rp}=await supabase.from('profiles').select('id,name,initials,primary_tag').in('id',recipIds);
    (rp||[]).forEach(p=>{recipMap[p.id]=p;});
  }

  // Build thread map keyed by the other party's profile id
  const threadMap={};

  for(const m of received){
    const sp=senderMap[m.sender_id];
    const key=sp?sp.id:('anon_'+m.sender_id);
    if(!threadMap[key]||new Date(m.created_at)>new Date(threadMap[key].latestAt)){
      threadMap[key]={profileId:sp?.id||null,latestAt:m.created_at,preview:m.body,unread:!m.read,name:sp?.name||'Unknown',initials:sp?.initials||'?',tag:sp?.primary_tag||'snowboard'};
    } else if(!m.read){ threadMap[key].unread=true; }
  }

  for(const m of sent){
    const rp=recipMap[m.recipient_profile_id];
    if(!rp)continue;
    const key='sent_'+rp.id;
    // Don't overwrite a received-message thread (prefer showing received)
    if(threadMap[rp.id])continue;
    if(!threadMap[key]||new Date(m.created_at)>new Date(threadMap[key].latestAt)){
      threadMap[key]={profileId:rp.id,latestAt:m.created_at,preview:m.body,unread:false,name:rp.name,initials:rp.initials,tag:rp.primary_tag};
    }
  }

  const threads=Object.values(threadMap).sort((a,b)=>new Date(b.latestAt)-new Date(a.latestAt));
  renderMessagesList(threads);
  updateNotifBadge();
}

function renderMessagesList(threads){
  const list=document.getElementById('messages-list');
  if(!threads.length){
    list.innerHTML='<div style="padding:40px 20px;color:#6b7280;text-align:center;font-size:.85rem;">No messages yet</div>';
    return;
  }
  list.innerHTML=threads.map(t=>{
    const meta=TAG_META[t.tag]||TAG_META['snowboard'];
    return `<div class="msg-row" onclick="openChatWithProfileId('${t.profileId}')">
      <div class="msg-avatar" style="background:${meta.bg};border:2px solid ${meta.color};color:${meta.color};">${escapeHtml(t.initials)}</div>
      <div class="msg-info">
        <div class="msg-meta"><span class="msg-from">${escapeHtml(t.name)}</span><span class="msg-time">${formatMsgTime(t.latestAt)}</span></div>
        <div class="msg-preview">${escapeHtml(t.preview)}</div>
      </div>
      ${t.unread?'<div class="msg-unread-dot"></div>':''}
    </div>`;
  }).join('');
}

async function openChatWithProfileId(profileId){
  if(!profileId){return;}
  const found=creators.find(c=>c.id===profileId);
  if(found){openChatWith(found);return;}
  const{data}=await supabase.from('profiles').select('*').eq('id',profileId).single();
  if(data)openChatWith(toCreator(data));
}

async function openChatWith(creator){
  if(!currentUser){openLoginModal();return;}
  closeAllPanels();
  window._activeChatCreator=creator;
  const meta=TAG_META[creator.primaryTag]||TAG_META['snowboard'];
  document.getElementById('chat-title').textContent=creator.name;
  const ca=document.getElementById('chat-avatar');
  ca.textContent=creator.initials; ca.style.background=meta.bg; ca.style.borderColor=meta.color; ca.style.color=meta.color;
  // Rate proposal button: only visible to creators (users with a profile)
  const rateBtn=document.getElementById('rate-proposal-btn');
  if(rateBtn)rateBtn.style.display=userProfile?'flex':'none';
  const rpForm=document.getElementById('rate-proposal-form');
  if(rpForm)rpForm.style.display='none';
  document.getElementById('chat-bubbles').innerHTML='<div style="padding:24px;color:#6b7280;text-align:center;font-size:.85rem;">Loading…</div>';
  document.getElementById('chat-panel').classList.add('open');
  await loadChatMessages(creator.id, creator.userId);
}

async function loadChatMessages(creatorProfileId, creatorUserId){
  if(!currentUser)return;
  let cUserId=creatorUserId;
  if(!cUserId){
    const{data}=await supabase.from('profiles').select('user_id').eq('id',creatorProfileId).single();
    cUserId=data?.user_id;
  }
  // Query 1: messages I sent to this creator
  const{data:sent}=await supabase.from('messages').select('*').eq('sender_id',currentUser.id).eq('recipient_profile_id',creatorProfileId).order('created_at');
  // Query 2: messages this creator sent to me
  let received=[];
  if(userProfile&&cUserId){
    const{data}=await supabase.from('messages').select('*').eq('sender_id',cUserId).eq('recipient_profile_id',userProfile.id).order('created_at');
    received=data||[];
  }
  // Merge and sort by created_at
  const all=[...(sent||[]),...received].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  renderChatBubbles(all);
  // Mark received as read
  if(userProfile&&cUserId){
    supabase.from('messages').update({read:true}).eq('recipient_profile_id',userProfile.id).eq('sender_id',cUserId);
  }
}

function renderChatBubbles(msgs){
  const bubbles=document.getElementById('chat-bubbles');
  if(!msgs.length){
    bubbles.innerHTML='<div style="padding:40px 20px;color:#6b7280;text-align:center;font-size:.85rem;">No messages yet. Say hello! 👋</div>';
    return;
  }
  bubbles.innerHTML=msgs.map(m=>{
    const out=m.sender_id===currentUser?.id;
    if(m.is_rate_proposal){
      return `<div class="bubble-wrap ${out?'out':''}"><div class="bubble ${out?'out':'in'}"><div style="font-size:.7rem;font-weight:700;opacity:.75;margin-bottom:4px;">💰 Offer</div><div style="font-size:1.1rem;font-weight:800;">$${m.proposed_rate}</div><div style="font-size:.78rem;opacity:.8;margin-top:3px;">${escapeHtml(m.body)}</div></div></div>`;
    }
    return `<div class="bubble-wrap ${out?'out':''}"><div class="bubble ${out?'out':'in'}">${escapeHtml(m.body)}</div></div>`;
  }).join('');
  bubbles.scrollTop=bubbles.scrollHeight;
}

async function sendChatMessage(){
  if(!currentUser)return;
  const input=document.getElementById('chat-input');
  const text=input.value.trim();
  if(!text)return;
  const creator=window._activeChatCreator;
  if(!creator)return;
  input.value='';
  const{error}=await supabase.from('messages').insert([{sender_id:currentUser.id,recipient_profile_id:creator.id,body:text,is_rate_proposal:false,read:false}]);
  if(error){showToast('Failed to send','#ef4444');input.value=text;return;}
  // Fire-and-forget — don't block the UI on email delivery
  supabase.functions.invoke('notify-message',{body:{recipientProfileId:creator.id,senderName:userProfile?.name||'Someone',messageBody:text}}).catch(()=>{});
  await loadChatMessages(creator.id, creator.userId);
}

function toggleRateProposalForm(){
  const form=document.getElementById('rate-proposal-form');
  if(!form)return;
  const show=form.style.display==='none'||!form.style.display;
  form.style.display=show?'flex':'none';
  if(show)document.getElementById('rate-proposal-input').focus();
}

async function sendRateProposal(){
  if(!currentUser)return;
  const creator=window._activeChatCreator;
  if(!creator)return;
  const rateInput=document.getElementById('rate-proposal-input');
  const rate=parseInt(rateInput.value);
  if(!rate||rate<=0){showToast('Enter a valid rate','#ef4444');return;}
  rateInput.value='';
  document.getElementById('rate-proposal-form').style.display='none';
  const{error}=await supabase.from('messages').insert([{sender_id:currentUser.id,recipient_profile_id:creator.id,body:`Offer: $${rate}`,is_rate_proposal:true,proposed_rate:rate,read:false}]);
  if(error){showToast('Failed to send','#ef4444');return;}
  await loadChatMessages(creator.id, creator.userId);
}

function closeMessages(){ document.getElementById('messages-panel').classList.remove('open'); }

async function closeChat(){
  document.getElementById('chat-panel').classList.remove('open');
  const rpForm=document.getElementById('rate-proposal-form');
  if(rpForm)rpForm.style.display='none';
  if(currentUser)await fetchAndOpenMessages();
}

async function updateNotifBadge(){
  const badge=document.getElementById('notif-badge');
  if(!badge)return;
  if(!currentUser||!userProfile){badge.style.display='none';return;}
  const{count}=await supabase.from('messages').select('*',{count:'exact',head:true}).eq('recipient_profile_id',userProfile.id).eq('read',false);
  badge.textContent=count||0;
  badge.style.display=count>0?'flex':'none';
}

// ─── MY PROFILE ──────────────────────────────────────────────────────────────

function openMyProfile(){ closeAllPanels(); const p=userProfile||myProfile; const meta=TAG_META[p.primaryTag]||TAG_META['snowboard']; const av=document.getElementById('mp-avatar'); if(p.avatarUrl){av.textContent='';av.style.background=meta.bg;av.style.borderColor=meta.color;av.style.backgroundImage=`url(${p.avatarUrl})`;av.style.backgroundSize='cover';av.style.backgroundPosition='center';}else{av.textContent=p.initials;av.style.background=meta.bg;av.style.borderColor=meta.color;av.style.color=meta.color;av.style.backgroundImage='';} document.getElementById('mp-name').textContent=p.name; document.getElementById('mp-location').textContent=p.location||''; document.getElementById('mp-bio').value=p.bio||''; document.getElementById('mp-views').textContent=userProfile?.viewCount||0; document.getElementById('mp-inquiries').textContent=0; document.getElementById('mp-earnings').textContent=(userProfile?.rating||5.0).toFixed(1)+'★'; if(userProfile){supabase.from('profiles').select('view_count').eq('id',userProfile.id).single().then(({data})=>{document.getElementById('mp-views').textContent=data?.view_count||0;});supabase.from('messages').select('*',{count:'exact',head:true}).eq('recipient_profile_id',userProfile.id).then(({count})=>{document.getElementById('mp-inquiries').textContent=count||0;});} document.getElementById('mp-half-rate').value=p.rates?.halfDay||''; document.getElementById('mp-full-rate').value=p.rates?.fullDay||''; document.getElementById('mp-tags').innerHTML=(p.tags||[]).map(t=>{const m=TAG_META[t];return m?`<span class="tag-chip" style="background:${m.color}18;color:${m.color};border-color:${m.color}40">${m.label}</span>`:''}).join(''); document.getElementById('mp-gear-list').innerHTML=(p.gear||[]).map((g,i)=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#1f2937;border-radius:8px;margin-bottom:6px;font-size:0.85rem;"><span>▸ ${escapeHtml(g)}</span><button onclick="removeGear(${i})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1.1rem;">×</button></div>`).join(''); document.getElementById('live-toggle').checked=p.isLive??true; updateLiveStatus(); document.getElementById('rates-visible-toggle').checked=p.showRates||false; updateRatesVisStatus(); document.getElementById('mp-portfolio-url').value=p.portfolioUrl||''; document.getElementById('mp-instagram').value=p.instagramHandle?`@${p.instagramHandle}`:''; renderMpScheduleGrid(); renderMpPortfolioGrid(); const anBtn=document.getElementById('mp-avail-now-btn'); if(anBtn){const active=userProfile&&isAvailNow(userProfile);anBtn.classList.toggle('active',active);anBtn.textContent=active?'🟢 Available Now — tap to turn off':'🟢 Set Available Now (8 hrs)';} document.getElementById('my-profile-panel').classList.add('open'); }
function closeMyProfile(){ document.getElementById('my-profile-panel').classList.remove('open'); }
function removeGear(idx){ (userProfile||myProfile).gear.splice(idx,1); openMyProfile(); }
function addGear(){ const input=document.getElementById('mp-gear-input'); const val=input.value.trim(); if(!val)return; (userProfile||myProfile).gear.push(val); input.value=''; openMyProfile(); showToast(`Added: ${val}`); }
async function saveProfile(){ const igRaw=document.getElementById('mp-instagram').value.trim().replace('@',''); const updates={bio:document.getElementById('mp-bio').value.trim(),half_day_rate:parseInt(document.getElementById('mp-half-rate').value)||null,full_day_rate:parseInt(document.getElementById('mp-full-rate').value)||null,show_rates:document.getElementById('rates-visible-toggle').checked,portfolio_url:document.getElementById('mp-portfolio-url').value.trim(),gear:(userProfile||myProfile).gear,instagram_handle:igRaw||null}; if(userProfile){const{error}=await supabase.from('profiles').update(updates).eq('id',userProfile.id);if(error){showToast('Error saving','#ef4444');return;}const{data:fresh}=await supabase.from('profiles').select('*').eq('id',userProfile.id).single();if(fresh)userProfile=toCreator(fresh);fetchAndRender();}else{myProfile.rates.halfDay=updates.half_day_rate||myProfile.rates.halfDay;myProfile.rates.fullDay=updates.full_day_rate||myProfile.rates.fullDay;myProfile.bio=updates.bio||myProfile.bio;myProfile.showRates=updates.show_rates;myProfile.portfolioUrl=updates.portfolio_url;} closeMyProfile();showToast('Profile saved ✓'); }
function updateLiveStatus(){ const s=document.getElementById('live-status'); const on=document.getElementById('live-toggle').checked; if(on){s.textContent='Live on map';s.style.color='#34d399';}else{s.textContent='Hidden from map';s.style.color='#6b7280';} }
function updateJnRatesToggle(){ const on=document.getElementById('jn-show-rates')?.checked; const slider=document.getElementById('jn-rates-slider'); const knob=document.getElementById('jn-rates-knob'); if(slider)slider.style.background=on?'#818cf8':'#374151'; if(knob)knob.style.transform=on?'translateX(18px)':'translateX(0)'; }
function updateRatesVisStatus(){ const s=document.getElementById('rates-vis-status'); const on=document.getElementById('rates-visible-toggle').checked; if(s){s.textContent=on?'Visible on profile':'Hidden — rates on request';s.style.color=on?'#34d399':'#6b7280';} }
function showToast(msg,color){ const t=document.getElementById('toast'); t.textContent=msg; t.style.background=color||'#16a34a'; t.classList.add('show'); clearTimeout(window._toastTimer); window._toastTimer=setTimeout(()=>t.classList.remove('show'),3000); }
function applyFilter(filter){ activeFilter=filter; const filtered=filter==='all'?creators:creators.filter(c=>c.tags.includes(filter)); renderMarkers(filtered); if(selectedId&&!filtered.find(c=>c.id===selectedId))closeCard(); document.querySelectorAll('.filter-chip').forEach(chip=>chip.classList.toggle('active',chip.dataset.filter===filter)); }
document.querySelectorAll('.filter-chip').forEach(chip=>chip.addEventListener('click',()=>applyFilter(chip.dataset.filter)));
function openJoin(){ closeAllPanels(); document.querySelectorAll('#jn-name,#jn-location,#jn-bio,#jn-gear,#jn-portfolio-url,#jn-instagram').forEach(el=>el.value=''); const termsBox=document.getElementById('jn-terms'); if(termsBox)termsBox.checked=false; const jnImg=document.getElementById('jn-avatar-img'); if(jnImg){jnImg.src='';jnImg.style.display='none';} const jnHint=document.getElementById('jn-avatar-hint'); if(jnHint)jnHint.style.display='flex'; const jnInput=document.getElementById('jn-avatar-input'); if(jnInput)jnInput.value=''; document.querySelectorAll('.spec-check').forEach(cb=>cb.checked=false); document.getElementById('jn-half').value=''; document.getElementById('jn-full').value=''; const sr=document.getElementById('jn-show-rates'); if(sr){sr.checked=false;updateJnRatesToggle();} if(currentUser){ const meta=currentUser.user_metadata; const name=meta?.full_name||meta?.name||''; if(name)document.getElementById('jn-name').value=name; } document.getElementById('join-panel').classList.add('open'); document.getElementById('overlay').classList.add('active'); }
function closeJoin(){ document.getElementById('join-panel').classList.remove('open'); document.getElementById('overlay').classList.remove('active'); }
async function geocodeLocation(locationStr){ try{ const res=await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationStr)}.json?limit=1&access_token=${MAPBOX_TOKEN}`); const json=await res.json(); const [lng,lat]=json.features?.[0]?.center||[]; return{lat:lat||39.0968,lng:lng||-120.0324}; }catch(e){ return{lat:39.0968,lng:-120.0324}; } }
async function submitJoin(){ const termsChecked=document.getElementById('jn-terms')?.checked; if(!termsChecked){showToast('Please accept the Terms & Privacy Policy','#ef4444');return;} if(!currentUser){const{data:{session}}=await supabase.auth.getSession();if(session?.user){currentUser=session.user;}else{showToast('Please sign in first','#ef4444');closeJoin();openLoginModal();return;}} const name=document.getElementById('jn-name').value.trim(); const location=document.getElementById('jn-location').value.trim(); const tags=[...document.querySelectorAll('.spec-check:checked')].map(cb=>cb.value); if(!name){showToast('Please enter your name','#ef4444');return;} if(!location){showToast('Please enter your location','#ef4444');return;} if(!tags.length){showToast('Select at least one specialty','#ef4444');return;} const btn=document.getElementById('join-submit'); btn.disabled=true; btn.textContent='Adding you…'; const parts=name.trim().split(/\s+/); const initials=parts.length>=2?(parts[0][0]+parts[parts.length-1][0]).toUpperCase():name.slice(0,2).toUpperCase(); const gearRaw=document.getElementById('jn-gear').value; const gear=gearRaw?gearRaw.split(',').map(g=>g.trim()).filter(Boolean):[]; const portfolioRaw=document.getElementById('jn-portfolio-url')?.value?.trim()||''; const portfolioUrl=portfolioRaw?(portfolioRaw.startsWith('http')?portfolioRaw:`https://${portfolioRaw}`):''; const {lat,lng}=await geocodeLocation(location); let avatarUrl=null; const avatarFile=document.getElementById('jn-avatar-input')?.files?.[0]; if(avatarFile&&currentUser){const{error:upErr}=await supabase.storage.from('avatars').upload(`${currentUser.id}.jpg`,avatarFile,{upsert:true,contentType:avatarFile.type});if(!upErr)avatarUrl=supabase.storage.from('avatars').getPublicUrl(`${currentUser.id}.jpg`).data.publicUrl;} const row={name,initials,primary_tag:tags[0],lat,lng,location,rating:5.0,review_count:0,tags,bio:document.getElementById('jn-bio').value.trim(),gear,half_day_rate:parseInt(document.getElementById('jn-half').value)||null,full_day_rate:parseInt(document.getElementById('jn-full').value)||null,schedule:[true,true,true,true,true,true,true],is_live:true,show_rates:document.getElementById('jn-show-rates')?.checked||false,portfolio_url:portfolioUrl,user_id:currentUser?.id||null,avatar_url:avatarUrl,instagram_handle:document.getElementById('jn-instagram')?.value?.trim().replace('@','')||null}; const {data:inserted,error}=await supabase.from('profiles').insert([row]).select().single(); btn.disabled=false; btn.textContent='Add me to the map'; if(error){console.error(error);showToast('Error — try again','#ef4444');return;} if(inserted)userProfile=toCreator(inserted); updateProfileBtn(); closeJoin(); showToast("You're on the map! 🎉"); await fetchAndRender(); if(userProfile){map.flyTo({center:[userProfile.lng,userProfile.lat],zoom:12,duration:1200});} }
document.getElementById('join-btn').addEventListener('click',()=>{ if(userProfile){openMyProfile();}else if(currentUser){openJoin();}else{openLoginModal();} });
document.getElementById('join-close').addEventListener('click',closeJoin);
document.getElementById('jn-show-rates').addEventListener('change',updateJnRatesToggle);
document.getElementById('join-submit').addEventListener('click',submitJoin);
document.getElementById('close-btn').addEventListener('click',closeCard);
document.getElementById('btn-book').addEventListener('click',e=>{e.stopPropagation();openBooking();});
document.getElementById('btn-message').addEventListener('click',e=>{e.stopPropagation();if(!currentUser){openLoginModal();return;}openChatWith(activeCreator);});
document.getElementById('booking-back').addEventListener('click',closeBooking);
document.querySelectorAll('.dur-btn').forEach(btn=>btn.addEventListener('click',()=>setDuration(btn.dataset.type)));
document.getElementById('send-booking-btn').addEventListener('click',async()=>{ const btn=document.getElementById('send-booking-btn'); const name=activeCreator?.name; btn.textContent='Sending...'; btn.disabled=true; const shootDate=document.getElementById('booking-date').value; const notes=document.getElementById('booking-notes').value; const duration=document.querySelector('.dur-btn[style*="818cf8"]')?.dataset?.type||'half'; const{error}=await supabase.from('bookings').insert([{client_user_id:currentUser?.id||null,creator_profile_id:activeCreator.id,shoot_type:document.getElementById('booking-type').value,shoot_date:shootDate,duration,notes,status:'pending'}]); if(error){showToast('Failed to send request','#ef4444');btn.textContent='Send booking request';btn.disabled=false;return;} if(currentUser){await supabase.from('messages').insert([{sender_id:currentUser.id,recipient_profile_id:activeCreator.id,body:`📅 Booking request for ${shootDate||'TBD'} — ${notes||'No notes'}`,is_rate_proposal:false,read:false}]);} btn.textContent='Send booking request'; btn.disabled=false; closeBooking(); showToast(`Booking request sent to ${name}! ✓`); });
document.getElementById('msg-btn').addEventListener('click',()=>{ if(!currentUser){openLoginModal();return;} fetchAndOpenMessages(); });
document.getElementById('messages-back').addEventListener('click',closeMessages);
document.getElementById('chat-back').addEventListener('click',closeChat);
document.getElementById('rate-proposal-btn').addEventListener('click',toggleRateProposalForm);
// ─── LOCATION PICKER ────────────────────────────────────────────────────────
function openLocationPicker(){
  if(!userProfile){showToast('Sign in first','#ef4444');return;}
  closeMyProfile();
  map.dragPan.enable();
  map.scrollZoom.enable();
  map.touchZoomRotate.enable();
  document.getElementById('location-picker').classList.add('active');
  map.flyTo({center:[userProfile.lng,userProfile.lat],zoom:13,duration:800});
}
function closeLocationPicker(){
  document.getElementById('location-picker').classList.remove('active');
}
async function confirmLocation(){
  const{lng,lat}=map.getCenter();
  const{error}=await supabase.from('profiles').update({lat,lng}).eq('id',userProfile.id);
  if(error){showToast('Failed to update location','#ef4444');return;}
  userProfile.lat=lat; userProfile.lng=lng;
  closeLocationPicker();
  fetchAndRender();
  showToast('📍 Pin location updated!');
}
document.getElementById('mp-set-location').addEventListener('click',openLocationPicker);
document.getElementById('location-picker-cancel').addEventListener('click',()=>{ closeLocationPicker(); openMyProfile(); });
document.getElementById('location-picker-confirm-btn').addEventListener('click',confirmLocation);

// ─── PORTFOLIO PHOTOS ────────────────────────────────────────────────────────
function renderMpPortfolioGrid(){
  const grid=document.getElementById('mp-portfolio-grid');
  if(!grid||!userProfile)return;
  const photos=userProfile.portfolioPhotos||[];
  grid.innerHTML='';
  for(let i=0;i<6;i++){
    const url=photos[i]||null;
    const cell=document.createElement('div');
    cell.className='mp-portfolio-cell'+(url?' filled':'');
    if(url){
      cell.innerHTML=`<img src="${url}" /><button class="mp-photo-rm" onclick="removePortfolioPhoto(${i})">✕</button>`;
    }else{
      const input=document.createElement('input');
      input.type='file'; input.accept='image/*';
      input.addEventListener('change',e=>{const f=e.target.files[0];if(f)uploadPortfolioPhoto(i,f);});
      const plus=document.createElement('span');
      plus.className='mp-photo-add'; plus.textContent='+';
      cell.appendChild(plus); cell.appendChild(input);
      cell.addEventListener('click',()=>input.click());
    }
    grid.appendChild(cell);
  }
}
async function uploadPortfolioPhoto(index,file){
  if(!userProfile||!currentUser){showToast('Sign in first','#ef4444');return;}
  showToast('Uploading…','#818cf8');
  const path=`${currentUser.id}/${index}.jpg`;
  const{error}=await supabase.storage.from('portfolio').upload(path,file,{upsert:true,contentType:file.type});
  if(error){showToast('Upload failed','#ef4444');return;}
  const url=supabase.storage.from('portfolio').getPublicUrl(path).data.publicUrl;
  const photos=[...(userProfile.portfolioPhotos||[])];
  while(photos.length<=index)photos.push(null);
  photos[index]=url;
  const{error:dbErr}=await supabase.from('profiles').update({portfolio_photos:photos.filter(Boolean)}).eq('id',userProfile.id);
  if(dbErr){showToast('Save failed','#ef4444');return;}
  userProfile.portfolioPhotos=photos;
  renderMpPortfolioGrid();
  showToast('Photo added ✓');
}
async function removePortfolioPhoto(index){
  if(!userProfile)return;
  const photos=[...(userProfile.portfolioPhotos||[])];
  photos[index]=null;
  const filtered=photos.filter(Boolean);
  await supabase.from('profiles').update({portfolio_photos:filtered}).eq('id',userProfile.id);
  userProfile.portfolioPhotos=filtered;
  renderMpPortfolioGrid();
  showToast('Photo removed','#6b7280');
}
function renderCardPortfolioGrid(creator){
  const wrap=document.getElementById('card-photos-wrap');
  const grid=document.getElementById('card-photo-grid');
  if(!wrap||!grid)return;
  const photos=(creator.portfolioPhotos||[]).filter(Boolean);
  if(!photos.length){wrap.style.display='none';return;}
  wrap.style.display='block';
  grid.innerHTML=photos.map(url=>`<div class="card-photo-cell"><img src="${url}" loading="lazy" onclick="openLightbox('${url}')" /></div>`).join('');
}
function openLightbox(url){
  document.getElementById('photo-lightbox-img').src=url;
  document.getElementById('photo-lightbox').classList.add('open');
}
function closeLightbox(){
  document.getElementById('photo-lightbox').classList.remove('open');
  document.getElementById('photo-lightbox-img').src='';
}
document.getElementById('photo-lightbox').addEventListener('click',e=>{if(e.target===e.currentTarget)closeLightbox();});
document.getElementById('lightbox-close').addEventListener('click',closeLightbox);
// ─── AVAILABILITY ────────────────────────────────────────────────────────────
function renderMpScheduleGrid(){
  const grid=document.getElementById('mp-schedule-grid');
  if(!grid||!userProfile)return;
  const schedule=userProfile.schedule||[true,true,true,true,true,true,true];
  const today=new Date();
  grid.innerHTML=schedule.map((on,i)=>{
    const d=new Date(today);d.setDate(today.getDate()+i);
    const label=i===0?'TODAY':DAY_ABBR[d.getDay()];
    return`<div class="mp-avail-cell ${on?'on':'off'}" onclick="toggleScheduleDay(${i})"><span class="mp-avail-dname">${label}</span><span class="mp-avail-num">${d.getDate()}</span><span class="mp-avail-dot"></span></div>`;
  }).join('');
}
async function toggleScheduleDay(i){
  if(!userProfile)return;
  const sched=[...userProfile.schedule];
  sched[i]=!sched[i];
  userProfile.schedule=sched;
  renderMpScheduleGrid();
  await supabase.from('profiles').update({schedule:sched}).eq('id',userProfile.id);
}
async function toggleAvailNow(){
  if(!userProfile){showToast('Sign in first','#ef4444');return;}
  const active=isAvailNow(userProfile);
  const btn=document.getElementById('mp-avail-now-btn');
  if(active){
    await supabase.from('profiles').update({available_now:false,available_until:null}).eq('id',userProfile.id);
    userProfile.availableNow=false;userProfile.availableUntil=null;
    if(btn){btn.classList.remove('active');btn.textContent='🟢 Set Available Now (8 hrs)';}
    showToast('Available Now turned off','#6b7280');
  }else{
    const until=new Date(Date.now()+8*3600000).toISOString();
    await supabase.from('profiles').update({available_now:true,available_until:until}).eq('id',userProfile.id);
    userProfile.availableNow=true;userProfile.availableUntil=until;
    if(btn){btn.classList.add('active');btn.textContent='🟢 Available Now — tap to turn off';}
    showToast('🟢 You\'re Available Now for 8 hours!','#16a34a');
  }
  fetchAndRender();
}
document.getElementById('mp-avail-now-btn').addEventListener('click',toggleAvailNow);
window.openChatWithProfileId=openChatWithProfileId;
window.removeGear=removeGear;
window.sendRateProposal=sendRateProposal;
window.toggleRateProposalForm=toggleRateProposalForm;
window.toggleScheduleDay=toggleScheduleDay;
window.removePortfolioPhoto=removePortfolioPhoto;
window.openLightbox=openLightbox;
// Join form — avatar preview
document.getElementById('jn-avatar-input').addEventListener('change',e=>{
  const file=e.target.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const img=document.getElementById('jn-avatar-img');
    img.src=ev.target.result; img.style.display='block';
    document.getElementById('jn-avatar-hint').style.display='none';
  };
  reader.readAsDataURL(file);
});
// My Profile — avatar upload
document.getElementById('mp-avatar-input').addEventListener('change',async e=>{
  const file=e.target.files[0]; if(!file||!currentUser||!userProfile)return;
  const{error}=await supabase.storage.from('avatars').upload(`${currentUser.id}.jpg`,file,{upsert:true,contentType:file.type});
  if(error){showToast('Upload failed','#ef4444');return;}
  const url=supabase.storage.from('avatars').getPublicUrl(`${currentUser.id}.jpg`).data.publicUrl;
  await supabase.from('profiles').update({avatar_url:url}).eq('id',userProfile.id);
  userProfile.avatarUrl=url;
  const av=document.getElementById('mp-avatar');
  av.textContent=''; av.style.backgroundImage=`url(${url})`; av.style.backgroundSize='cover'; av.style.backgroundPosition='center';
  showToast('Photo updated ✓');
  fetchAndRender();
});
document.getElementById('chat-send').addEventListener('click',sendChatMessage);
document.getElementById('chat-input').addEventListener('keydown',e=>{if(e.key==='Enter')sendChatMessage();});
document.getElementById('profile-btn').addEventListener('click',()=>{ if(!currentUser){openLoginModal();}else if(!userProfile){openJoin();}else{openMyProfile();} });
document.getElementById('mp-close').addEventListener('click',closeMyProfile);
document.getElementById('mp-invite-btn').addEventListener('click',()=>{ const shareUrl='https://shutter-app.netlify.app'; const shareText='Join me on Shutter — the map for outdoor creators around Lake Tahoe 🏔️'; if(navigator.share){navigator.share({title:'Join Shutter',text:shareText,url:shareUrl});}else{navigator.clipboard.writeText(shareUrl).then(()=>showToast('Link copied! 📋'));} });
document.getElementById('mp-signout').addEventListener('click',async()=>{ await supabase.auth.signOut(); closeMyProfile(); showToast('Signed out'); });
document.getElementById('mp-save').addEventListener('click',saveProfile);
document.getElementById('mp-add-gear').addEventListener('click',addGear);
document.getElementById('mp-gear-input').addEventListener('keydown',e=>{if(e.key==='Enter')addGear();});
document.getElementById('live-toggle').addEventListener('change',async e=>{ const val=e.target.checked; updateLiveStatus(); if(userProfile){await supabase.from('profiles').update({is_live:val}).eq('id',userProfile.id);userProfile.isLive=val;fetchAndRender();} showToast(val?"You're live on the map! 🟢":"Hidden from map",val?'#16a34a':'#6b7280'); });
document.getElementById('rates-visible-toggle').addEventListener('change',async e=>{ const val=e.target.checked; updateRatesVisStatus(); if(userProfile){await supabase.from('profiles').update({show_rates:val}).eq('id',userProfile.id);userProfile.showRates=val;} });
let touchStartY=0;
const card=document.getElementById('profile-card');
card.addEventListener('touchstart',e=>{touchStartY=e.touches[0].clientY;},{passive:true});
card.addEventListener('touchmove',e=>{if(e.touches[0].clientY-touchStartY>60)closeCard();},{passive:true});
const joinPanel=document.getElementById('join-panel');
joinPanel.addEventListener('touchstart',e=>{touchStartY=e.touches[0].clientY;},{passive:true});
joinPanel.addEventListener('touchmove',e=>{if(e.touches[0].clientY-touchStartY>80)closeJoin();},{passive:true});
document.getElementById('login-close').addEventListener('click',closeLoginModal);
document.getElementById('login-modal').addEventListener('click',e=>{if(e.target===e.currentTarget)closeLoginModal();});
document.getElementById('login-google').addEventListener('click',signInWithGoogle);
document.getElementById('login-send').addEventListener('click',sendMagicLink);
document.getElementById('login-email').addEventListener('keydown',e=>{if(e.key==='Enter')sendMagicLink();});
document.getElementById('locate-btn').addEventListener('click',()=>{
  if(!navigator.geolocation){showToast('Geolocation not supported','#ef4444');return;}
  const btn=document.getElementById('locate-btn');
  btn.style.transform='scale(0.9)'; btn.style.opacity='0.5';
  navigator.geolocation.getCurrentPosition(
    pos=>{
      btn.style.transform='scale(1)'; btn.style.opacity='1';
      map.flyTo({center:[pos.coords.longitude,pos.coords.latitude],zoom:13,pitch:50,duration:1200,essential:true});
    },
    ()=>{
      btn.style.transform='scale(1)'; btn.style.opacity='1';
      showToast('Could not get your location','#ef4444');
    },
    {timeout:8000,enableHighAccuracy:true}
  );
});
initAuth();
