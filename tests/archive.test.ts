import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {inspectArchive} from '../frontend/src/archive.js';
async function archive(files:Record<string,string>,name='website.zip') {const zip=new JSZip();for(const [path,data] of Object.entries(files))zip.file(path,data);return new File([await zip.generateAsync({type:'arraybuffer'})],name);}
test('local archive inspection detects nested root and lists real files',async()=>{const site=await inspectArchive(await archive({'site/index.html':'<h1>Hello</h1>','site/style.css':'body{}'}));assert.deepEqual(site.entries,['site/index.html']);assert.equal(site.files.length,2);});
test('local archive rejects missing entry point',async()=>{await assert.rejects(()=>archive({'readme.txt':'hello'}).then(inspectArchive),/index.html/);});
test('local archive rejects traversal even after JSZip normalization',async()=>{await assert.rejects(()=>archive({'../index.html':'hello'}).then(inspectArchive),/tidak aman/);});
test('local archive rejects non ZIP, corrupt ZIP, and oversized input',async()=>{await assert.rejects(()=>inspectArchive(new File(['x'],'file.txt')),/\.zip/);await assert.rejects(()=>inspectArchive(new File(['broken'],'file.zip')));await assert.rejects(()=>inspectArchive(new File([new Uint8Array(10*1024*1024+1)],'big.zip')),/10 MB/);});
