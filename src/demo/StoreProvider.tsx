import {createContext,useContext,useRef,useState,type ReactNode} from 'react';
import type {Actor,Command,DemoState,Result} from '../domain/types';
import {applyCommand} from '../domain/commands';
import {loadDemo,saveDemo} from './storage';
import {seed} from './seed';
interface Store {state:DemoState;actor:Actor;warning?:string;dispatch:(c:Command)=>Result<DemoState>;selectActor:(a:Actor)=>void;reset:()=>void}
const Context=createContext<Store|null>(null);
export function StoreProvider({children,initialState,initialActor}:{children:ReactNode;initialState?:DemoState;initialActor?:Actor}){
 const [loaded]=useState(()=>{if(initialState)return {state:initialState,warning:undefined};try{return loadDemo(window.localStorage);}catch{return {state:seed(),warning:'Storage unavailable. This demo is temporary.'};}});
 const [state,setState]=useState(loaded.state),[actor,selectActor]=useState<Actor>(initialActor??{role:'student',studentId:'emma'}),[warning,setWarning]=useState<string|undefined>(loaded.warning);const ref=useRef(state);ref.current=state;
 function persist(next:DemoState){ref.current=next;setState(next);try{const r=saveDemo(window.localStorage,next);if(r.warning)setWarning(r.warning);}catch{setWarning('Storage unavailable. This demo is temporary.');}}
 function dispatch(command:Command){const r=applyCommand(ref.current,actor,command);if(r.ok)persist(r.value);return r;}
 return <Context.Provider value={{state,actor,warning,dispatch,selectActor,reset:()=>persist(seed())}}>{children}</Context.Provider>;
}
export function useDemo(){const value=useContext(Context);if(!value)throw Error('Demo provider is required');return value;}
export function useStudent(){const {state,actor}=useDemo();return state.students.find(s=>s.id===(actor.role==='student'?actor.studentId:'emma'))!;}
