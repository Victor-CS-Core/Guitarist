import {seed} from './seed';
import {levels,skills,activities} from '../curriculum/foundations';
import {statuses,type DemoState} from '../domain/types';
const key='guitarist.demo.v1';
export function loadDemo(storage:Storage):{state:DemoState;warning?:string}{
 try{const raw=storage.getItem(key);if(!raw)return {state:seed()};const s:DemoState=JSON.parse(raw);
 const date=(v:string)=>typeof v==='string'&&Number.isFinite(Date.parse(v));
 if(s.version!==1||!Array.isArray(s.students)||s.students.length!==2||!['emma','noah'].every(id=>s.students.some(x=>x.id===id))||!s.students.every(x=>typeof x.name==='string'&&typeof x.goal==='string'&&levels.some(l=>l.id===x.currentLevelId)&&Array.isArray(x.unlockedLevels)&&x.unlockedLevels.includes(x.currentLevelId)&&x.unlockedLevels.every(id=>levels.some(l=>l.id===id))&&x.skills&&skills.every(k=>statuses.includes(x.skills[k.id]))))throw Error();
 const known=(id:string)=>s.students.some(x=>x.id===id);
 if(!Array.isArray(s.assignments)||!s.assignments.every(a=>typeof a.id==='string'&&known(a.studentId)&&date(a.at)&&Array.isArray(a.items)&&a.items.every(i=>typeof i.id==='string'&&activities.some(x=>x.id===i.activityId)&&Number.isFinite(i.minutes)&&i.minutes>0&&i.minutes<=60&&Number.isInteger(i.repetitions)&&i.repetitions>0&&i.repetitions<=100&&typeof i.completed==='boolean')))throw Error();
 if(!Array.isArray(s.sessions)||!s.sessions.every(x=>typeof x.id==='string'&&known(x.studentId)&&date(x.at)&&Number.isFinite(x.durationSeconds)&&x.durationSeconds>=0&&x.durationSeconds<=86400&&Array.isArray(x.itemIds)&&x.itemIds.every(id=>s.assignments.some(a=>a.studentId===x.studentId&&a.items.some(i=>i.id===id)))))throw Error();
 if(!Array.isArray(s.notes)||!Array.isArray(s.events)||![...s.notes,...s.events].every(x=>typeof x.id==='string'&&known(x.studentId)&&typeof x.text==='string'&&date(x.at)))throw Error();
 return {state:s};
 }catch{return {state:seed(),warning:'Your saved demo could not be opened. A fresh demo is ready.'};}
}
export function saveDemo(storage:Storage,state:DemoState):{warning?:string}{try{storage.setItem(key,JSON.stringify(state));return {};}catch{return {warning:'Browser storage is unavailable. Your demo works until this page is closed.'};}}
