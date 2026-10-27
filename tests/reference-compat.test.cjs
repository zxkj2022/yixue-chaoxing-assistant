'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const sources = require('./helpers/question-sources.cjs')(['index','reader','matcher','writer','collection-answer']);
const bundle = '(function(){const sources=' + JSON.stringify(sources) + ';const cache={};function load(name){if(cache[name])return cache[name].exports;const module={exports:{}};cache[name]=module;new Function("require","module","exports",sources[name])(load,module,module.exports);return module.exports;}window.questionModule=load("./index.js");})();';
let browser;
before(async()=>{browser=await chromium.launch({channel:'chrome',headless:true});});
after(async()=>{await browser?.close();});
async function fixture(html,callback){
    const context=await browser.newContext({serviceWorkers:'block'});
    try{await context.route('**/*',route=>route.fulfill({body:''}));const page=await context.newPage();await page.setContent(html);await page.addScriptTag({content:bundle});return await callback(page);}finally{await context.close();}
}

test('div-based examination choices remove separate badges and reconcile multi-selection',async()=>{
    const html='<div class="noSplitBx"><h2 class="type_tit">多选题</h2><h3 class="mark_name">1. (多选题, 2.0分) 多选适配</h3><div class="stem_answer">'+['甲','乙','丙'].map((text,index)=>'<div role="checkbox" onclick="this.querySelector(\'span\').classList.toggle(\'check_answer_dx\')"><span class="addMultipleChoice">'+String.fromCharCode(65+index)+'</span><p>'+text+'</p></div>').join('')+'</div></div>';
    const result=await fixture(html,page=>page.evaluate(async()=>{
        const workflow=questionModule.createQuestionWorkflow({bank:{search:async()=>({code:1,data:'甲#丙'})},wait:async()=>{}});
        document.querySelectorAll('.stem_answer > div')[1].click();
        const read=workflow.read(document).map(({title,options})=>({title,options}));
        const first=await workflow.run(document),second=await workflow.run(document);
        return {read,answered:first.answered+second.answered,selected:Array.from(document.querySelectorAll('.check_answer_dx')).map(el=>el.textContent)};
    }));
    assert.deepEqual(result,{read:[{title:'多选适配',options:['甲','乙','丙']}],answered:2,selected:['A','C']});
});

test('named hidden editor markers resolve native editors once and synchronize fill fields',async()=>{
    const html='<div class="TiMu" data="321"><input type="hidden" name="answertype321" value="2"><h3 class="Zy_TItle">填空题</h3>'+[1,2].map(i=>'<textarea name="answerEditor321'+i+'" style="display:none"></textarea><div class="edui-editor" id="edui'+i+'"><iframe id="ueditor_'+i+'"></iframe></div>').join('')+'</div>';
    const result=await fixture(html,page=>page.evaluate(async()=>{
        const writes=[],sync=[];window.UE={getEditor:id=>({setContent:value=>writes.push({id,value})})};window.syncAnswer=(id,type)=>sync.push([id,type]);
        const workflow=questionModule.createQuestionWorkflow({bank:{search:async()=>({code:1,data:'<甲>#!#乙'})},unsafeWindow:window});
        const question=workflow.read(document)[0];
        const run=await workflow.run(document);
        return {ids:question.fields.map(field=>field.id),answered:run.answered,writes,sync};
    }));
    assert.deepEqual(result,{ids:['answerEditor3211','answerEditor3212'],answered:1,writes:[{id:'answerEditor3211',value:'&lt;甲&gt;'},{id:'answerEditor3212',value:'乙'}],sync:[['321','2']]});
});

test('judgment choices with native true/false values are readable when their icons contain no text',async()=>{
    const html='<div class="TiMu"><input name="answertype123" value="3" type="hidden"><h3 class="Zy_TItle">判断适配</h3><ul><li><input type="radio" name="judge" value="true"><i class="right-icon"></i></li><li><input type="radio" name="judge" value="false"><i class="wrong-icon"></i></li></ul></div>';
    const result=await fixture(html,page=>page.evaluate(async()=>{
        const queries=[];const run=await questionModule.createQuestionWorkflow({bank:{search:async query=>{queries.push(query);return {code:1,data:'错误'};}}}).run(document);
        return {answered:run.answered,options:queries[0].options,checked:Array.from(document.querySelectorAll('input[type=radio]')).map(el=>el.checked)};
    }));
    assert.deepEqual(result,{answered:1,options:['正确','错误'],checked:[false,true]});
});

test('sequential search responses always wait and repeated failures extend the interval',async()=>{
    const html=Array.from({length:5},(_,i)=>'<div class="TiMu"><input type="hidden" name="answertype'+i+'" value="0"><h3 class="Zy_TItle">题目'+i+'</h3><label><input type="radio" name="a'+i+'">甲</label></div>').join('');
    const result=await fixture(html,page=>page.evaluate(async()=>{
        const events=[];let index=0;
        const run=await questionModule.createQuestionWorkflow({now:()=>100,wait:async ms=>events.push(['wait',ms]),bank:{search:async()=>{events.push(['search',index]);if(index++===0)throw new Error('offline');if(index===2)return {code:0,reason:'upstream-error'};return {code:1,data:'甲'};}}}).run(document);
        return {answered:run.answered,events};
    }));
    assert.equal(result.answered,3);
    assert.deepEqual(result.events,[['search',0],['wait',5000],['search',1],['wait',10000],['search',2],['wait',2000],['search',3],['wait',2000],['search',4]]);
});

test('the search interval persists across single-question page runs',async()=>{
    const html='<div class="TiMu"><input name="answertype1" type="hidden" value="0"><h3 class="Zy_TItle">第一页</h3><label><input type="radio" name="a">甲</label></div>';
    const result=await fixture(html,page=>page.evaluate(async()=>{
        const waits=[],calls=[];
        const workflow=questionModule.createQuestionWorkflow({now:()=>100,wait:async ms=>waits.push(ms),bank:{search:async q=>{calls.push(q.title);return {code:1,data:'甲'};}}});
        await workflow.run(document);
        document.querySelector('.Zy_TItle').textContent='第二页';
        await workflow.run(document);
        return {waits,calls};
    }));
    assert.deepEqual(result,{waits:[2000],calls:['第一页','第二页']});
});

test('cancelling a search cooldown never sends the next query',async()=>{
    const html=[1,2].map(i=>'<div class="TiMu"><input name="answertype'+i+'" type="hidden" value="0"><h3 class="Zy_TItle">题目'+i+'</h3><label><input type="radio" name="a'+i+'">甲</label></div>').join('');
    const result=await fixture(html,page=>page.evaluate(async()=>{
        const controller=new AbortController();let calls=0,waits=0;
        const run=await questionModule.createQuestionWorkflow({wait:async()=>{waits++;controller.abort();throw Object.assign(new Error('cancelled'),{name:'AbortError'});},bank:{search:async()=>{calls++;return {code:1,data:'甲'};}}}).run(document,{signal:controller.signal});
        return {calls,waits,stopped:run.stopped};
    }));
    assert.deepEqual(result,{calls:1,waits:1,stopped:true});
});
