import JSZip from 'jszip';
export interface Website {name:string; files:string[]; entries:string[]; zip:JSZip;}
export async function inspectArchive(file:File):Promise<Website> {
 if(!file.name.toLowerCase().endsWith('.zip')) throw new Error('Pilih file website berformat .zip.');
 // Local preview only. Server-side streamed extraction with hard resource caps is still required.
 if(file.size>10*1024*1024) throw new Error('Preview lokal dibatasi 10 MB.');
 const zip=await JSZip.loadAsync(file);
 const files=Object.values(zip.files).filter(f=>!f.dir);
 if(files.length>1000) throw new Error('Maksimal 1.000 file untuk preview lokal.');
 for(const f of files){const raw=(f as typeof f & {unsafeOriginalName?:string}).unsafeOriginalName ?? f.name;if(raw.includes('\\')||raw.startsWith('/')||raw.split('/').includes('..')||/^[a-z]:/i.test(raw))throw new Error('Archive berisi path tidak aman.');}
 const entries=files.map(f=>f.name).filter(n=>/(^|\/)index\.html$/i.test(n));
 if(!entries.length) throw new Error('index.html tidak ditemukan dalam ZIP.');
 return {name:file.name,files:files.map(f=>f.name).sort(),entries,zip};
}
export async function previewHtml(site:Website,entry:string):Promise<string>{
 const file=site.zip.file(entry);if(!file)throw new Error('Entry point tidak ditemukan.');
 const html=await file.async('string');
 if(html.length>2*1024*1024) throw new Error('HTML terlalu besar untuk preview lokal.');
 const doc=new DOMParser().parseFromString(html,'text/html');
 doc.querySelectorAll('script,iframe,object,embed,base,meta[http-equiv],link[rel="preload"]').forEach(n=>n.remove());
 // Never execute uploaded scripts. This is a static HTML/CSS preview, not an Android runtime.
 const root=entry.slice(0,entry.lastIndexOf('/')+1);
 async function dataUrl(path:string):Promise<string|null>{
  if(/^(?:[a-z]+:|\/\/|#)/i.test(path))return null;
  const resolved=new URL(path,'https://preview.invalid/'+root).pathname.slice(1);
  const asset=site.zip.file(decodeURIComponent(resolved));if(!asset)return null;
  const ext=resolved.split('.').pop()?.toLowerCase();
  const mime:Record<string,string>={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',svg:'image/svg+xml',ico:'image/x-icon'};
  if(!ext||!mime[ext])return null;
  const bytes=await asset.async('uint8array');if(bytes.length>2*1024*1024)return null;
  return `data:${mime[ext]};base64,${await asset.async('base64')}`;
 }
 for(const image of Array.from(doc.querySelectorAll('img'))){const url=await dataUrl(image.getAttribute('src')||'');if(url)image.setAttribute('src',url);else image.removeAttribute('src');image.removeAttribute('srcset');}
 for(const link of Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))){const href=link.getAttribute('href')||'';if(!/^(?:[a-z]+:|\/\/)/i.test(href)){const path=new URL(href,'https://preview.invalid/'+root).pathname.slice(1);const css=site.zip.file(decodeURIComponent(path));if(css){const text=await css.async('string');if(text.length<1024*1024){const style=doc.createElement('style');style.textContent=text;link.replaceWith(style);continue;}}}link.remove();}
 const csp=doc.createElement('meta');csp.httpEquiv='Content-Security-Policy';csp.content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; form-action 'none'; base-uri 'none'";doc.head.prepend(csp);
 return '<!doctype html>'+doc.documentElement.outerHTML;
}
