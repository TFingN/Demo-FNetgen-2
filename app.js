/* F-NétGen: interactive demo + optional server-side OpenAI integration.
   No API key or personal image data is stored in the browser's localStorage. */
(() => {
  'use strict';
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const A = './assets/';
  const OCCASIONS = [
    { id:'tot-nghiep', label:'Lễ tốt nghiệp', icon:'🎓', note:'Tỏa sáng ngày đặc biệt' },
    { id:'di-choi', label:'Đi chơi', icon:'👜', note:'Thoải mái, giàu cá tính' },
    { id:'cong-so', label:'Đi làm / Công sở', icon:'💼', note:'Chỉn chu mà độc đáo' },
    { id:'le-hoi', label:'Lễ hội', icon:'🏮', note:'Đậm sắc màu văn hóa' },
    { id:'chup-anh', label:'Chụp ảnh', icon:'📷', note:'Lên hình thật nổi bật' },
    { id:'khac', label:'Khác', icon:'✨', note:'Tạo nên dịp của riêng bạn' }
  ];
  const TRADITIONS = [
    { id:'ao-dai', label:'Áo dài Nhật Bình', image:'ÁO NHẬT BÌNH (tách nền).png', desc:'Trang phục giàu tính biểu tượng của Việt Nam, nổi bật với dáng áo dài, đường xẻ tà và phom thanh thoát. Dễ phối với quần suông, chân váy hoặc phụ kiện hiện đại.' },
    { id:'vien-linh', label:'Ngũ thân tay chẽn', image:'ÁO NGŨ THÂN TAY CHẼN (tách nền).png', desc:'Dạng áo cổ tròn (viên lĩnh) trong hệ thống trang phục truyền thống Việt Nam, thường có thân áo rộng, tay áo và chi tiết trang trí thay đổi theo bối cảnh lịch sử. Có thể cách điệu bằng phom tối giản, chất liệu nhẹ và phụ kiện đương đại.' }
  ];
  const MODERN = [
    {id:'quan', label:'Quần', icon:'👖'}, {id:'ao',label:'Áo',icon:'👕'},
    {id:'vay',label:'Váy',icon:'👗'}, {id:'dam',label:'Đầm',icon:'🩰'}
  ];
  const STYLES = [
    {id:'thanh-lich', label:'Thanh lịch', desc:'Tinh tế, nhẹ nhàng, sang trọng',image:'style-elegant.png',symbol:'✦'},
    {id:'lich-lam', label:'Lịch lãm', desc:'Trưởng thành, chỉn chu, mạnh mẽ',image:'style-formal.png',symbol:'◈'},
    {id:'de-thuong',label:'Dễ thương',desc:'Trẻ trung, mềm mại, đáng yêu',image:'style-cute.png',symbol:'❀'},
    {id:'ca-tinh',label:'Cá tính',desc:'Nổi bật, phá cách, mang chất riêng',image:'style-bold.png',symbol:'ϟ'}
  ];
  const PALETTES = [
    {id:'do-gam',label:'Đỏ gấm',color:'#9a2928'}, {id:'xanh-ngoc',label:'Xanh ngọc',color:'#427b73'},
    {id:'vang-kem',label:'Vàng kem',color:'#e8c58d'}, {id:'den-tram',label:'Đen trầm',color:'#242728'},
    {id:'hong-dat',label:'Hồng đất',color:'#c78c86'}
  ];
  const state = {
    step:0, occasion:null, occasionOther:'', tradition:'ao-dai', modern:['ao'],ratio:30,styles:[],
    outfits:[],selectedOutfit:null,isRealAI:false,aiAvailable:false,loading:false,
    uploadedImage:'',uploadedName:'',recognition:'',palette:'do-gam',silhouette:'suong',
    length:'tieu-chuan',note:'',modal:null
  };
  const esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const byId = (items,id) => items.find(v=>v.id===id);
  const styleNames = () => state.styles.map(id=>byId(STYLES,id)?.label).filter(Boolean);
  const humanTradition = () => byId(TRADITIONS,state.tradition)?.label || 'Áo dài';
  const humanOccasion = () => state.occasion==='khac' && state.occasionOther.trim() ? state.occasionOther.trim() : (byId(OCCASIONS,state.occasion)?.label || 'Dịp của bạn');
  const btn = (action,label,kind='primary',extra='') => `<button type="button" class="btn btn-${kind}" data-action="${action}" ${extra}>${label}</button>`;
  function logo(){return `<div class="brand"><img src="${A}logo-small.png" alt="" /><span class="brand-word">F-NétGen</span></div>`;}
  function header(){
    return `<header class="topbar">${logo()}<div class="topbar-right"><span class="step-label">${state.step===0?'TRANG CHỦ':state.step===6?'OUTFIT CỦA BẠN':`BƯỚC ${String(state.step).padStart(2,'0')} / 05`}</span>${state.step!==0?`<button class="ghost-home" data-action="home" aria-label="Về trang chủ">⌂ <span>Trang chủ</span></button>`:''}</div></header>`;
  }
  function progress(){ return state.step===0||state.step===6?'':`<div class="step-progress" aria-label="Tiến trình ${state.step} trên 5 bước">${[1,2,3,4,5].map(i=>`<div class="progress-segment ${i<=state.step?'is-active':''}"></div>`).join('')}</div>`; }
  function headline(title,subtitle,eyebrow='HÀNH TRÌNH PHỐI ĐỒ'){
    return `<div class="headline"><span class="eyebrow">✦ ${eyebrow} ✦</span><h1>${title}</h1><p>${subtitle}</p></div>`;
  }
  function navbar(backLabel='← QUAY LẠI',nextLabel='TIẾP TỤC →',nextAction='next'){
    return `<div class="bottom-nav">${btn('back',backLabel,'link')}${btn(nextAction,nextLabel,'primary')}</div>`;
  }
  function hero(){
    return `<div class="hero-wrap"><section class="hero-copy"><div class="eyebrow">✦ VIỆT PHỤC × THỜI TRANG ĐƯƠNG ĐẠI</div><h1 class="hero-title">F-NétGen</h1><div class="slogan">Mặc chất riêng – Giữ chất Việt</div><p class="hero-description">Một chút hồn Việt, một chút dấu ấn của bạn. Khám phá cách phối Việt phục với trang phục hiện đại, để mỗi ngày đều là một sàn diễn rất riêng.</p>${btn('start','BẮT ĐẦU PHỐI ĐỒ <span aria-hidden="true">↗</span>','primary')}</section><div class="hero-visual"><span class="sparkle sp1">✧</span><span class="sparkle sp2">✦</span><span class="sparkle sp3">✧</span><div class="hero-circle"><img src="${A}logo-main.png" alt="Biểu tượng cách điệu chữ N và nón lá của F-NétGen" /></div><div class="hero-tag">✦ NÉT VIỆT, CHẤT RIÊNG</div></div></div>`;
  }
  function step1(){
    return `${headline('Bạn đang chuẩn bị cho dịp nào?','Chọn một dịp — F-NétGen sẽ tìm cảm hứng phù hợp nhất cho bạn.','BƯỚC 1 · CHỌN DỊP')}
    <div class="choice-grid">${OCCASIONS.map(o=>`<button class="choice ${state.occasion===o.id?'is-selected':''}" data-action="occasion" data-value="${o.id}" aria-pressed="${state.occasion===o.id}"><span class="choice-icon" aria-hidden="true">${o.icon}</span><span><span class="choice-title">${o.label}</span><div class="choice-meta">${o.note}</div></span><span class="check-indicator">✓</span></button>`).join('')}</div>
    ${state.occasion==='khac'?`<div class="other-occasion"><label for="occasion-other">Bạn đang chuẩn bị cho dịp gì?</label><input id="occasion-other" type="text" maxlength="80" placeholder="Ví dụ: Dự đám cưới, gặp gỡ bạn bè…" value="${esc(state.occasionOther)}" /></div>`:''}
    ${navbar()}`;
  }
  function step2(){
    const traditionCards = TRADITIONS.map(v=>`<div class="selectable-card heritage-card ${state.tradition===v.id?'is-selected':''}"><button type="button" data-action="tradition" data-value="${v.id}" aria-pressed="${state.tradition===v.id}" style="all:unset;cursor:pointer;display:block;flex:1;min-width:0;"><div class="heritage-photo"><img src="${A}${v.image}" alt="Minh họa ${v.label}" /></div><div class="heritage-bottom"><strong>${v.label}</strong><span class="check-indicator" style="position:static;display:inline-grid;vertical-align:middle;margin-left:9px;">✓</span></div></button><button class="details-btn" style="position:absolute;bottom:12px;right:10px" data-action="info" data-value="${v.id}">ⓘ Tìm hiểu</button></div>`).join('');
    const modernCards = MODERN.map(v=>`<button class="modern-card ${state.modern.includes(v.id)?'is-selected':''}" data-action="modern" data-value="${v.id}" aria-pressed="${state.modern.includes(v.id)}"><span class="modern-icon">${v.icon}</span><strong>${v.label}</strong>${state.modern.includes(v.id)?'<span class="mini-tick">✓</span>':''}</button>`).join('');
    return `${headline('Chọn loại trang phục','Giữ nét Việt hay remix theo chất riêng của bạn?','BƯỚC 2 · CHẤT LIỆU PHỐI ĐỒ')}
      <section class="section-panel"><h2 class="subhead"><span class="number">1</span> NÉT VIỆT · Chọn 1 kiểu Việt phục</h2><div class="clothing-grid">${traditionCards}</div></section>
      <section class="section-panel"><h2 class="subhead"><span class="number">2</span> REMIX HIỆN ĐẠI · Chọn tối đa 2 loại</h2><div class="modern-grid">${modernCards}</div>
      <label class="upload-wrap" for="upload-img"><span class="upload-emblem">✦</span><span><strong>＋ Tải ảnh trang phục của bạn</strong><p>Ảnh JPG/PNG/WEBP (tối đa 5MB) — AI sẽ nhận diện khi được kết nối.</p></span>${state.uploadedImage?`<img class="upload-preview" src="${state.uploadedImage}" alt="Ảnh bạn đã tải lên" />`:''}</label><input id="upload-img" type="file" accept="image/png,image/jpeg,image/webp" style="display:none" />
      ${state.uploadedName?`<p class="upload-status">📎 ${esc(state.uploadedName)} · ${esc(state.recognition||'Đang chờ nhận diện')}</p>`:''}</section>
      <section class="section-panel"><h2 class="subhead"><span class="number">3</span> THANH TRUYỀN THỐNG</h2><div class="range-wrap"><div class="range-title">Bạn muốn giữ truyền thống đến mức nào?</div><div class="range-labels"><span>20%</span><span>50%</span></div><input id="heritage-range" aria-label="Tỷ lệ cảm hứng truyền thống" type="range" min="20" max="50" value="${state.ratio}" style="--fill:${Math.round((state.ratio-20)/30*100)}%" /><div class="range-descriptions"><span>Ít nét truyền thống hơn</span><span>Đậm nét truyền thống hơn</span></div><div class="ratio-summary"><div class="ratio-number" id="ratio-number">${state.ratio}%</div><div class="ratio-copy"><strong>GIỮ NÉT VIỆT</strong><p id="ratio-explain">${ratioText()}</p></div></div></div></section>
      ${navbar()}`;
  }
  function ratioText(){return state.ratio<=28?'Điểm nhấn Việt phục nhẹ nhàng, hiện đại.':state.ratio<=39?'Cân bằng nét Việt và cá tính hiện đại.':'Tăng cảm hứng di sản trong từng chi tiết.';}
  function step3(){
    return `${headline('Bạn muốn hôm nay trông như thế nào?','Chọn tối đa 2 phong cách để F-NétGen remix Việt phục theo chất riêng của bạn.','BƯỚC 3 · CHỌN PHONG CÁCH')}
    <div class="style-grid">${STYLES.map(s=>`<button class="selectable-card style-card ${state.styles.includes(s.id)?'is-selected':''}" data-action="style" data-value="${s.id}" aria-pressed="${state.styles.includes(s.id)}"><div class="style-photo"><img src="${A}${s.image}" alt="Hình ảnh tham khảo phong cách ${s.label}" loading="lazy" /></div><div class="style-info"><div><strong>${s.label.toUpperCase()}</strong><p>${s.desc}</p></div><div class="style-mark">✓</div></div></button>`).join('')}</div>
    <div class="selection-summary"><span class="ai-emblem">✦</span> Bạn đang chọn: <strong>${styleNames().length?styleNames().join(' + '):'Chưa chọn phong cách'}</strong> (${state.styles.length}/2)</div>
    ${navbar('← QUAY LẠI','✦ REMIX OUTFIT →','generate')}`;
  }
  function buildDemoOutfits(){
    const selection = state.styles.length?state.styles:STYLES.map(s=>s.id);
    const variations = [...selection,...STYLES.map(s=>s.id)].filter((x,i,arr)=>arr.indexOf(x)===i).slice(0,3);
    return variations.map((sid,i)=>({
      id:`outfit-${i+1}`,name:`OUTFIT ${String(i+1).padStart(2,'0')}`,
      subtitle:[`Di sản tinh giản · ${humanTradition()}`,`Chạm nét đương đại · ${humanTradition()}`,`Dấu ấn cá nhân · ${humanTradition()}`][i],
      image:A+(byId(STYLES,sid)?.image||'style-elegant.png'),
      fit:Math.max(79,Math.min(97,89+(state.styles.includes(sid)?5:0)+(i===0?1:i===1?-2:-4))),
      heritage:Math.max(20,Math.min(50,state.ratio + (i===0?0:i===1?-3:3))),
      styleId:sid,real:false
    }));
  }
  function imageMarkup(o){return `<img src="${o.image}" alt="Ảnh xem trước ${esc(o.name)}" class="${o.real?'generated':''}" loading="lazy" />`;}
  function step4(){
    if(state.loading) return `<div class="loading"><div class="spinner"></div><h2>Đang remix chất riêng của bạn…</h2><p>${state.aiAvailable?'Đang yêu cầu AI dựng 3 mẫu. Quá trình này có thể mất khoảng một phút.':'Đang chuẩn bị 3 bản phối demo từ hình tham khảo.'}<br/>Nét Việt sẽ được kết hợp cùng phong cách bạn đã chọn.</p></div>`;
    return `${headline('Chọn thiết kế bạn thích nhất',`${state.isRealAI?'AI đã tạo':'F-NétGen đã chuẩn bị'} 3 mẫu outfit dựa trên lựa chọn của bạn.`,'BƯỚC 4 · KHÁM PHÁ BẢN PHỐI')}
      <div class="mode-banner">${state.isRealAI?'✦ Hình được tạo qua AI. Điểm phù hợp là gợi ý minh họa, không phải phép đo khách quan.':'✦ CHẾ ĐỘ DEMO — Hình minh họa lấy từ bộ ảnh tham khảo; chưa phải trang phục do AI tạo mới.'}</div>
      <div class="outfit-grid">${state.outfits.map(o=>`<button class="selectable-card outfit-card ${state.selectedOutfit===o.id?'is-selected':''}" data-action="select-outfit" data-value="${o.id}" aria-pressed="${state.selectedOutfit===o.id}"><div class="outfit-image"><span class="outfit-chip">${esc(byId(STYLES,o.styleId)?.label||'Tự do sáng tạo')}</span>${imageMarkup(o)}</div><div class="outfit-foot"><div class="outfit-name"><strong>${esc(o.name)}</strong><div class="style-mark" style="color:${state.selectedOutfit===o.id?'#fff':'transparent'};background:${state.selectedOutfit===o.id?'var(--gold)':'white'};border-radius:50%;height:26px;width:26px;text-align:center;">✓</div></div><p class="outfit-description">${esc(o.subtitle)}</p><div class="metric-row"><div class="metric"><b>${o.heritage}%</b><span>Tỷ lệ cảm hứng Việt</span></div><div class="metric"><b>${o.fit}/100</b><span>Điểm hợp gu*</span></div></div></div></button>`).join('')}</div>
      <p class="demo-note">* Các thông số là mức gợi ý từ dữ liệu lựa chọn, không phải đánh giá chất liệu, số đo cơ thể hay kết quả kiểm định sản phẩm.</p>
      <div class="selection-summary"><span class="ai-emblem">✦</span> Bạn đang chọn: <strong>${esc(state.outfits.find(o=>o.id===state.selectedOutfit)?.name||'Hãy chọn 1 thiết kế')}</strong></div>
      <div class="bottom-nav">${btn('edit','✎ CHỈNH THÊM CHÚT','soft')}${btn('final','CHỐT OUTFIT ↗','primary')}</div>
      <div style="text-align:center;margin-top:20px">${btn('regenerate','↻ Thử tạo 3 mẫu khác','link')}</div>`;
  }
  function chosen(){return state.outfits.find(x=>x.id===state.selectedOutfit)||state.outfits[0];}
  function step5(){
    const o=chosen();
    return `${headline('Chỉnh thêm một chút','Tinh chỉnh bảng màu, phom dáng và những chi tiết làm nên chất riêng.','BƯỚC 5 · TINH CHỈNH')}
    <div class="editor-grid"><div class="editor-preview"><div class="editor-image">${imageMarkup(o)}<div class="editor-overlay" style="background:${byId(PALETTES,state.palette).color}"></div></div><div class="editor-label">✦ ${esc(o.name)} · ${esc(humanTradition())}</div></div>
      <div class="editor-form"><div class="form-group"><label class="form-label">01 — Chọn màu chủ đạo</label><div class="swatches">${PALETTES.map(c=>`<button type="button" data-action="palette" data-value="${c.id}" class="swatch ${state.palette===c.id?'is-selected':''}" aria-label="${c.label}" aria-pressed="${state.palette===c.id}" title="${c.label}" style="background:${c.color}"></button>`).join('')}</div><p class="demo-note" style="text-align:left">${esc(byId(PALETTES,state.palette).label)} · Màu phủ minh họa; nếu bật AI, bạn có thể tạo lại ảnh theo màu này.</p></div>
      <div class="form-group"><label class="form-label">02 — Phom dáng</label><div class="pill-options">${[['suong','Suông thoải mái'],['om','Ôm gọn'],['rong','Oversize']].map(([id,t])=>`<button class="pill-option ${state.silhouette===id?'is-selected':''}" data-action="silhouette" data-value="${id}" aria-pressed="${state.silhouette===id}">${t}</button>`).join('')}</div></div>
      <div class="form-group"><label class="form-label">03 — Độ dài trang phục</label><div class="pill-options">${[['ngan','Ngắn'],['tieu-chuan','Vừa phải'],['dai','Dài thướt tha']].map(([id,t])=>`<button class="pill-option ${state.length===id?'is-selected':''}" data-action="length" data-value="${id}" aria-pressed="${state.length===id}">${t}</button>`).join('')}</div></div>
      <div class="form-group"><label class="form-label" for="edit-note">04 — Bạn muốn sửa thêm điều gì?</label><textarea id="edit-note" class="textarea" maxlength="600" placeholder="Ví dụ: Thêm họa tiết hoa sen ở cổ áo, tay áo rộng hơn, phối cùng quần trắng…">${esc(state.note)}</textarea></div>
      <div class="form-group">${btn('apply-edits',state.aiAvailable?'✦ TẠO LẠI BẰNG AI':'✓ LƯU CHỈNH SỬA DEMO','primary','style="width:100%"')}<p class="demo-note">${state.aiAvailable?'Tạo lại 3 thiết kế sẽ sử dụng API và có thể phát sinh phí.':'Màu, phom dáng và ghi chú được lưu trong bản phối. Bật AI để dựng lại hình ảnh thật.'}</p></div></div></div>
      ${navbar('← VỀ 3 THIẾT KẾ','CHỐT OUTFIT ↗','final')}`;
  }
  function step6(){
    const o=chosen(), palette=byId(PALETTES,state.palette), sil={suong:'Suông thoải mái',om:'Ôm gọn',rong:'Oversize'}[state.silhouette];
    return `${headline('Outfit của bạn đã sẵn sàng!','Một bản phối mang dấu ấn rất riêng — và vẫn có chút hồn Việt.','HOÀN THÀNH · F-NÉTGEN')}
    <div class="final-grid"><div class="final-visual">${imageMarkup(o)}</div><div class="final-text"><span class="eyebrow">✦ CHẤT VIỆT · CHẤT RIÊNG</span><h2>${esc(o.name)}<br/>Made for you.</h2><p>Bạn đã chọn <strong>${esc(humanTradition())}</strong> để phối cùng <strong>${esc(state.modern.map(id=>byId(MODERN,id)?.label).filter(Boolean).join(' + ')||'trang phục hiện đại')}</strong> cho dịp <strong>${esc(humanOccasion())}</strong>. Cảm hứng thời trang: ${esc(styleNames().join(' + '))}.</p><div class="final-stats"><div class="final-stat"><strong>${o.heritage}%</strong><small>Cảm hứng truyền thống</small></div><div class="final-stat"><strong>${o.fit}/100</strong><small>Điểm hợp gu tham khảo</small></div><div class="final-stat"><strong>${esc(palette.label)}</strong><small>Màu bạn chọn</small></div><div class="final-stat"><strong>${esc(sil)}</strong><small>Phom dáng</small></div></div>${state.note?`<p><strong>Chi tiết cá nhân:</strong> ${esc(state.note)}</p>`:''}<div class="final-actions">${btn('download','↓ TẢI THIẾT KẾ','primary')}${btn('edit','✎ CHỈNH TIẾP','soft')}${btn('restart','↻ PHỐI ĐỒ MỚI','soft')}</div><p class="demo-note" style="text-align:left">Tệp tải về là thẻ ảnh thiết kế tham khảo. Chỉ số trong thẻ mang tính mô phỏng.</p></div></div>`;
  }
  function modalMarkup(){
    if(!state.modal) return '';
    const item = byId(TRADITIONS,state.modal);
    if(!item) return '';
    return `<div class="modal-backdrop" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-heading"><button data-action="close-modal" class="modal-close" aria-label="Đóng">×</button><div class="eyebrow">✦ NÉT VIỆT</div><h2 id="modal-heading">${item.label}</h2><p>${item.desc}</p><p style="font-size:11px;color:var(--muted)">Hình vẽ minh họa cách điệu cho giao diện, không phải tư liệu phục dựng lịch sử.</p>${btn('choose-info','CHỌN TRANG PHỤC NÀY','primary','data-value="'+item.id+'"')}</div></div>`;
  }
  function render(){
    const screens={0:hero,1:step1,2:step2,3:step3,4:step4,5:step5,6:step6};
    app.innerHTML=`<div class="shell">${header()}<main class="${state.step===0?'':'main-content'}">${progress()}${screens[state.step]?.()||hero()}</main><footer class="footer">F-NétGen © 2026 · Mặc chất riêng – Giữ chất Việt · Bản mẫu trải nghiệm</footer></div>${modalMarkup()}`;
    window.scrollTo({top:0,behavior:'instant'});
  }
  let toastTimer;
  function toast(text){clearTimeout(toastTimer);toastEl.textContent=text;toastEl.classList.add('show');toastTimer=setTimeout(()=>toastEl.classList.remove('show'),4200);}
  function navigate(step){state.step=step;render();}
  function validateNext(){
    if(state.step===1&&!state.occasion){toast('Hãy chọn một dịp trước khi tiếp tục.');return false;}
    if(state.step===2&&!state.modern.length){toast('Hãy chọn ít nhất một loại trang phục hiện đại.');return false;}
    if(state.step===3&&!state.styles.length){toast('Hãy chọn ít nhất một phong cách.');return false;}
    return true;
  }
  function gotoFinal(){if(!state.selectedOutfit){toast('Hãy chọn một outfit bạn yêu thích trước nhé.');return;}navigate(6);}
  async function generate(){
    if(!validateNext())return;
    state.loading=true;state.selectedOutfit=null;navigate(4);
    if(state.aiAvailable){
      try {
        const response=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({occasion:humanOccasion(),traditional:humanTradition(),modern:state.modern.map(id=>byId(MODERN,id)?.label),ratio:state.ratio,styles:styleNames(),palette:byId(PALETTES,state.palette)?.label,silhouette:state.silhouette,length:state.length,notes:state.note,recognizedClothing:state.recognition})});
        const data=await response.json();
        if(!response.ok||!Array.isArray(data.outfits)||data.outfits.length!==3)throw Error(data.error||'AI chưa trả đủ 3 thiết kế');
        state.outfits=data.outfits.map((o,i)=>({id:`outfit-${i+1}`,name:`OUTFIT ${String(i+1).padStart(2,'0')}`,image:o.image,subtitle:o.subtitle||['Di sản tối giản','Di sản đương đại','Cá tính phá cách'][i],fit:[95,91,89][i],heritage:state.ratio,styleId:state.styles[i%state.styles.length],real:true}));
        state.isRealAI=true;
      }catch(e){state.outfits=buildDemoOutfits();state.isRealAI=false;toast(`Không thể tạo ảnh AI: ${String(e.message).slice(0,115)}. Đã dùng bản demo.`);}
    }else{
      await new Promise(resolve=>setTimeout(resolve,650));
      state.outfits=buildDemoOutfits();state.isRealAI=false;
    }
    state.loading=false;render();
  }
  function act(action,value){
    switch(action){
      case 'start':navigate(1);break;
      case 'home':navigate(0);break;
      case 'occasion':state.occasion=value;render();break;
      case 'tradition':state.tradition=value;render();break;
      case 'modern':{
        if(state.modern.includes(value))state.modern=state.modern.filter(x=>x!==value);
        else if(state.modern.length>=2)return toast('Bạn có thể kết hợp tối đa 2 loại trang phục hiện đại.');
        else state.modern.push(value);
        render();break;
      }
      case 'style':{
        if(state.styles.includes(value))state.styles=state.styles.filter(x=>x!==value);
        else if(state.styles.length>=2)return toast('Bạn chỉ có thể chọn tối đa 2 phong cách.');
        else state.styles.push(value);
        render();break;
      }
      case 'info':state.modal=value;render();break;
      case 'close-modal':state.modal=null;render();break;
      case 'choose-info':state.tradition=value;state.modal=null;render();break;
      case 'next':if(validateNext())navigate(Math.min(state.step+1,6));break;
      case 'back':navigate(state.step===5?4:Math.max(0,state.step-1));break;
      case 'generate':generate();break;
      case 'regenerate':generate();break;
      case 'select-outfit':state.selectedOutfit=value;render();break;
      case 'edit':if(!state.selectedOutfit)return toast('Hãy chọn một thiết kế để chỉnh sửa.');navigate(5);break;
      case 'final':gotoFinal();break;
      case 'palette':state.palette=value;render();break;
      case 'silhouette':state.silhouette=value;render();break;
      case 'length':state.length=value;render();break;
      case 'apply-edits':{
        const noteInput=document.getElementById('edit-note');if(noteInput)state.note=noteInput.value.slice(0,600);
        if(state.aiAvailable)return generate();
        toast('Đã lưu các chỉnh sửa cho thẻ thiết kế demo.');break;
      }
      case 'restart':{const available=state.aiAvailable;Object.assign(state,{step:1,occasion:null,occasionOther:'',tradition:'ao-dai',modern:['ao'],ratio:30,styles:[],outfits:[],selectedOutfit:null,isRealAI:false,uploadedImage:'',uploadedName:'',recognition:'',palette:'do-gam',silhouette:'suong',length:'tieu-chuan',note:'',aiAvailable:available});render();break;}
      case 'download':downloadCard();break;
    }
  }
  app.addEventListener('click',(event)=>{
    const el=event.target.closest('[data-action]');if(!el)return;
    if(el.dataset.action==='close-modal'&&event.target!==el&&!el.classList.contains('modal-close'))return;
    if(el.closest('.modal')&&el.dataset.action==='close-modal') event.stopPropagation();
    act(el.dataset.action,el.dataset.value);
  });
  app.addEventListener('input',e=>{
    if(e.target.id==='heritage-range'){
      state.ratio=Number(e.target.value);
      e.target.style.setProperty('--fill',`${(state.ratio-20)/30*100}%`);
      const num=document.getElementById('ratio-number'),txt=document.getElementById('ratio-explain');
      if(num)num.textContent=state.ratio+'%';if(txt)txt.textContent=ratioText();
    }
    if(e.target.id==='edit-note')state.note=e.target.value.slice(0,600);
    if(e.target.id==='occasion-other')state.occasionOther=e.target.value.slice(0,80);
  });
  app.addEventListener('change',async e=>{
    if(e.target.id!=='upload-img')return;
    const file=e.target.files?.[0];if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){toast('Chỉ chấp nhận định dạng JPG, PNG hoặc WEBP.');return;}
    if(file.size>5*1024*1024){toast('Ảnh không được lớn hơn 5 MB.');return;}
    try{
      const dataUrl=await resizeUpload(file);state.uploadedImage=dataUrl;state.uploadedName=file.name;state.recognition=state.aiAvailable?'AI đang phân tích ảnh…':'Đã nhận ảnh · Chưa kết nối AI nhận diện';render();
      if(!state.aiAvailable)return;
      const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:dataUrl})});
      const data=await response.json();state.recognition=response.ok&&data.description?`AI nhận diện: ${data.description}`:'Không thể nhận diện ảnh';
      if(state.step===2)render();
    }catch(err){state.recognition='Nhận diện chưa khả dụng';if(state.step===2)render();toast('Chưa thể phân tích ảnh tải lên.');}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.modal){state.modal=null;render();}});
  async function resizeUpload(file){
    const url=URL.createObjectURL(file);
    try{
      const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=url;});
      const scale=Math.min(1,1024/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',0.8);
    }finally{URL.revokeObjectURL(url);}
  }
  function coverImage(canvas,ctx,img,x,y,w,h){
    const ratio=Math.max(w/img.width,h/img.height),iw=img.width*ratio,ih=img.height*ratio;
    ctx.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih);
  }
  async function downloadCard(){
    const outfit=chosen();if(!outfit)return;
    const canvas=document.createElement('canvas');canvas.width=900;canvas.height=1200;const c=canvas.getContext('2d');
    c.fillStyle='#fff8e8';c.fillRect(0,0,900,1200);
    c.strokeStyle='#c6a15b';c.lineWidth=3;c.strokeRect(38,38,824,1124);
    c.fillStyle='#a9221d';c.textAlign='center';c.font='bold 64px sans-serif';c.fillText('F-NétGen',450,117);
    c.font='bold 24px sans-serif';c.fillText('Mặc chất riêng – Giữ chất Việt',450,160);
    try{
      const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=outfit.image;});
      c.fillStyle='#f4e4c5';c.fillRect(75,198,750,720);const k=Math.min(750/img.width,720/img.height);const w=img.width*k,h=img.height*k;c.drawImage(img,75+(750-w)/2,198+(720-h)/2,w,h);
      if(state.palette){c.globalAlpha=.09;c.fillStyle=byId(PALETTES,state.palette).color;c.fillRect(75,198,750,720);c.globalAlpha=1;}
    }catch{toast('Không thể thêm ảnh vào bản tải xuống.');}
    c.fillStyle='#a9221d';c.font='bold 35px sans-serif';c.fillText(outfit.name,450,977);
    c.fillStyle='#654d3a';c.font='23px sans-serif';c.fillText(`${humanTradition()} · ${humanOccasion()}`,450,1022);
    c.font='20px sans-serif';c.fillText(`${outfit.heritage}% cảm hứng Việt  •  ${byId(PALETTES,state.palette).label}`,450,1061);
    c.font='17px sans-serif';c.fillText('Thiết kế tham khảo · f-netgen',450,1110);
    const link=document.createElement('a');link.download='F-NetGen-'+outfit.id+'.png';link.href=canvas.toDataURL('image/png');link.click();
    toast('Đã tạo thẻ ảnh thiết kế.');
  }
  async function init(){
    try{const r=await fetch('/api/status',{signal:AbortSignal.timeout(2500)});if(r.ok){const d=await r.json();state.aiAvailable=Boolean(d.aiConfigured);}}catch{state.aiAvailable=false;}
    render();
  }
  render();init();
})();
