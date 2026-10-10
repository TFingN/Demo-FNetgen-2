/**
 * F-NétGen local server. Node.js 18+; zero external dependencies.
 * Set OPENAI_API_KEY on the server to enable real AI generation and clothing recognition.
 * Never put keys in app.js, HTML, or other browser-delivered files.
 * Run: node server.js     then open http://localhost:3000
 */
'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const KEY = process.env.OPENAI_API_KEY || '';
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'gpt-image-1-mini';
const VISION_MODEL = process.env.VISION_MODEL || 'gpt-4.1-mini';
const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.webp':'image/webp'};
let busy = false;
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function bodyJson(req,limit=8*1024*1024){
  let size=0;const chunks=[];
  for await(const chunk of req){size+=chunk.length;if(size>limit){const err=Error('Dữ liệu quá lớn');err.status=413;throw err;}chunks.push(chunk);}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
  catch{const err=Error('Nội dung JSON không hợp lệ');err.status=400;throw err;}
}
function safeText(text,max=200){return String(text||'').slice(0,max).replace(/[\u0000-\u001f]/g,' ').trim();}
function safeArray(a){return Array.isArray(a)?a.slice(0,4).map(x=>safeText(x,80)):[];}
async function apiCall(route,payload,timeout=110000){
  const response=await fetch('https://api.openai.com/v1/'+route,{
    method:'POST',headers:{Authorization:'Bearer '+KEY,'Content-Type':'application/json'},
    body:JSON.stringify(payload),signal:AbortSignal.timeout(timeout)
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const err=Error(data.error?.message || ('OpenAI API HTTP '+response.status));err.status=response.status===429?429:502;throw err;}
  return data;
}
function generatePrompt(data,variant){
  const style=safeArray(data.styles).join(' + ')||'elegant', modern=safeArray(data.modern).join(' + ')||'modern basics';
  const variations=[
    'Variation 1: contemporary minimal, beautifully tailored, quietly refined, restrained details, wearable in real life.',
    'Variation 2: fashion-forward editorial, asymmetrical layering, a refined youthful visual statement.',
    'Variation 3: bold culturally inspired street style, striking details while maintaining good silhouette and wearability.'
  ];
  return `Design a culturally respectful Vietnam-inspired couture outfit as a high-quality full-body fashion campaign photograph. Show ONE adult model wearing a newly imagined, coherent and physically plausible COMPLETE outfit. The core garment must visibly reference traditional Vietnamese ${safeText(data.traditional,80)} and retain around ${Math.max(20,Math.min(50,Number(data.ratio)||30))}% visual inspiration from Vietnamese dress; the rest is adapted to today's urban fashion. Incorporate modern category: ${modern}. Occasion: ${safeText(data.occasion,80)}. Preferred fashion mood: ${style}. Suggested main color: ${safeText(data.palette,70)}. Cut: ${safeText(data.silhouette,70)}. Length: ${safeText(data.length,70)}. User customization: ${safeText(data.notes,600)||'none'}. Existing clothes described by image recognition: ${safeText(data.recognizedClothing,140)||'none'}. ${variations[variant]} Respect identifiable Vietnamese garment construction and avoid conflating Vietnamese elements with other national costumes. Fashion photography with warm ivory studio background, gold ornamental circular motif, elegant indirect studio light, luxurious textile detail, photorealistic, full body, both feet in frame, no text, no logos, no watermark. Vertical portrait composition.`;
}
async function handleGenerate(req,res){
  if(!KEY)return json(res,503,{error:'Chưa cấu hình OPENAI_API_KEY. Chế độ demo vẫn hoạt động.'});
  if(busy)return json(res,429,{error:'Đang có yêu cầu tạo ảnh. Vui lòng thử lại sau.'});
  busy=true;
  try{
    const data=await bodyJson(req,128*1024);
    if(!data.traditional||!data.occasion)return json(res,400,{error:'Thiếu thông tin lựa chọn trang phục hoặc dịp.'});
    const result=[];
    // Sequential generation controls API rate limits and billable concurrency.
    for(let i=0;i<3;i++){
      const reply=await apiCall('images/generations',{
        model:IMAGE_MODEL, prompt:generatePrompt(data,i), size:'1024x1536', quality:'medium', n:1,output_format:'jpeg'
      });
      const base64=reply.data?.[0]?.b64_json;
      if(!base64)throw Error('Mô hình không trả về dữ liệu hình ảnh.');
      result.push({image:'data:image/jpeg;base64,'+base64,subtitle:['Di sản tinh giản · phối phom hiện đại','Giao thoa đương đại · thanh thoát','Phá cách cá tính · đậm chất riêng'][i]});
    }
    json(res,200,{outfits:result});
  }catch(err){console.error('Generate failed:',err.message);json(res,err.status||502,{error:String(err.message).slice(0,250)});}
  finally{busy=false;}
}
async function handleAnalyze(req,res){
  if(!KEY)return json(res,503,{error:'Chưa cấu hình OPENAI_API_KEY.'});
  try{
    const body=await bodyJson(req);
    if(typeof body.image!=='string'||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(body.image)||body.image.length>8*1024*1024)return json(res,400,{error:'Ảnh không hợp lệ hoặc quá lớn.'});
    const reply=await apiCall('responses',{
      model:VISION_MODEL,max_output_tokens:140,
      input:[{role:'user',content:[
        {type:'input_text',text:'Quan sát trang phục trong ảnh. Trả lời bằng một câu tiếng Việt ngắn dưới 100 ký tự, gồm loại trang phục (quần/áo/váy/đầm hoặc khác), màu sắc và đặc điểm nổi bật. Không đoán danh tính, giới tính, tuổi hoặc thương hiệu. Nếu không thấy trang phục, nói rõ không xác định được.'},
        {type:'input_image',image_url:body.image,detail:'low'}
      ]}]
    },30000);
    const description=(reply.output||[]).flatMap(x=>x.content||[]).map(x=>x.text||'').join(' ').trim().slice(0,180);
    json(res,200,{description:description||'Không xác định được loại trang phục.'});
  }catch(err){console.error('Analyze failed:',err.message);json(res,err.status||502,{error:String(err.message).slice(0,200)});}
}
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/api/status'&&req.method==='GET')return json(res,200,{aiConfigured:Boolean(KEY),imageModel:KEY?IMAGE_MODEL:null});
    if(url.pathname==='/api/generate'&&req.method==='POST')return await handleGenerate(req,res);
    if(url.pathname==='/api/analyze'&&req.method==='POST')return await handleAnalyze(req,res);
    if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Method not allowed'});
    const raw=url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname);
    const full=path.resolve(ROOT,'.'+raw);
    if(!full.startsWith(ROOT+path.sep)||full===path.join(ROOT,'server.js')||/\/(?:\.env|README\.md)/i.test(full))return json(res,403,{error:'Forbidden'});
    let file;
    try{file=await fs.readFile(full);}catch{return json(res,404,{error:'Not found'});}
    res.writeHead(200,{'Content-Type':MIME[path.extname(full).toLowerCase()]||'application/octet-stream','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; script-src 'self';"});
    res.end(req.method==='HEAD'?undefined:file);
  }catch(err){json(res,err.status||500,{error:err.message||'Unexpected error'});}
});
server.listen(PORT,HOST,()=>console.log(`F-NétGen: http://${HOST}:${PORT} | AI: ${KEY?'bật':'demo'}`));
