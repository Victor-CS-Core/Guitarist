import {it,expect} from 'vitest';
import {loadDemo,saveDemo} from './storage';
import {seed} from './seed';
const values=new Map<string,string>();
const localStorage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}} as Storage;
it('recovers corrupt, wrong-version and invalid-reference snapshots',()=>{for(const value of ['{broken',JSON.stringify({version:9}),JSON.stringify({...seed(),students:[{id:'missing'}]})]){localStorage.setItem('guitarist.demo.v1',value);const r=loadDemo(localStorage);expect(r.state.students.map(s=>s.id)).toEqual(['emma','noah']);expect(r.warning).toBeTruthy();}});
it('round trips a valid snapshot and reports blocked writes',()=>{saveDemo(localStorage,seed());expect(loadDemo(localStorage).warning).toBeUndefined();const blocked={setItem(){throw Error('blocked');}} as unknown as Storage;expect(saveDemo(blocked,seed()).warning).toBeTruthy();});
