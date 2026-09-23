export interface Skill {id:string;title:string;levelId:string;description:string;required:boolean}
export interface Level {id:string;order:number;title:string;description:string;badgeId:string;goal:string;skills:Skill[]}
export interface Activity {id:string;skillId:string;title:string;description:string;minutes:number;kind:'parts'|'strings'|'fingers'|'notes'|'chord'|'builder'|'rhythm'|'transition';chordId?:string;steps:string[]}
