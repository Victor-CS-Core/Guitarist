import { describe,it,expect } from 'vitest';
import { seed } from '../demo/seed';
import { applyCommand } from './commands';
import { canUnlock,earnedBadgeIds } from './selectors';
import type { DemoState,Command } from './types';
const at='2026-09-23T12:00:00Z';
const teacher={role:'teacher' as const};
function run(state:DemoState,command:Command){const r=applyCommand(state,teacher,command);if(!r.ok)throw Error(r.error);return r.value;}
describe('teacher-controlled mastery',()=>{
 it('rejects student mastery and other learner changes',()=>{
 expect(applyCommand(seed(),{role:'student',studentId:'noah'},{type:'assess',studentId:'noah',skillId:'string-numbers',status:'MASTERED',at}).ok).toBe(false);
 expect(applyCommand(seed(),{role:'student',studentId:'emma'},{type:'completePractice',studentId:'noah',sessionId:'s1',durationSeconds:12,itemIds:['noah-strings'],at}).ok).toBe(false);
 });
 it('requires explicit teacher unlock after mastery',()=>{
 let s=seed();expect(canUnlock(s,'noah','level-2')).toBe(false);
 for(const id of ['guitar-parts','string-numbers','finger-numbers','holding','picking'])s=run(s,{type:'assess',studentId:'noah',skillId:id,status:'MASTERED',at});
 expect(canUnlock(s,'noah','level-2')).toBe(true);expect(s.students[1].unlockedLevels).not.toContain('level-2');
 expect(earnedBadgeIds(s,'noah')).toContain('guitar-explorer');
 s=run(s,{type:'unlock',studentId:'noah',levelId:'level-2',at});expect(s.students[1].unlockedLevels).toContain('level-2');
 });
 it('requires an override reason and preserves rejected state',()=>{const s=seed();const before=JSON.stringify(s);expect(applyCommand(s,teacher,{type:'unlock',studentId:'noah',levelId:'level-2',overrideReason:' ',at}).ok).toBe(false);expect(JSON.stringify(s)).toBe(before);expect(run(s,{type:'unlock',studentId:'noah',levelId:'level-2',overrideReason:'Reviewed readiness in person',at}).students[1].currentLevelId).toBe('level-2');});
 it('rejects invalid targets and unknown records',()=>{for(const minutes of [-1,0,NaN,Infinity])expect(applyCommand(seed(),teacher,{type:'assign',studentId:'noah',activityId:'strings',minutes,repetitions:1,at}).ok).toBe(false);expect(applyCommand(seed(),teacher,{type:'assess',studentId:'missing',skillId:'picking',status:'MASTERED',at}).ok).toBe(false);});
 it('records practice once without mastering skills',()=>{const cmd:Command={type:'completePractice',studentId:'noah',sessionId:'once',durationSeconds:23,itemIds:['noah-strings'],at};const s=run(seed(),cmd);expect(s.sessions.filter(x=>x.id==='once')).toHaveLength(1);expect(run(s,cmd).sessions).toHaveLength(s.sessions.length);expect(s.students[1].skills['string-numbers']).not.toBe('MASTERED');});
 it('rejects invalid completion and reinforcement without reason',()=>{expect(applyCommand(seed(),teacher,{type:'completePractice',studentId:'noah',sessionId:'bad',durationSeconds:NaN,itemIds:['unknown'],at}).ok).toBe(false);expect(applyCommand(seed(),teacher,{type:'assess',studentId:'emma',skillId:'chord-am',status:'NEEDS_REINFORCEMENT',at}).ok).toBe(false);});
});
