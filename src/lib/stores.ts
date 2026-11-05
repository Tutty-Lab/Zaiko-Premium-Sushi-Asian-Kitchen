import type { Employee, Schedule } from "../types";
import { type WeekdayKey } from "./demand";
import { type DemandBand, type StaffingRule } from "./staffing";
import { zaikoEmployees } from "./restaurantData";
import { clip } from "./staffing";
import type { WorkHoursConfig } from "./workHours";
export type StoreConfig = { id:string; name:string; shortName:string; address:string; sampleEmployees:()=>Employee[]; workHours?:WorkHoursConfig; notes?:string; demandProfile?:readonly DemandBand[]; dayWeights:Record<WeekdayKey,number>; staffingRules:readonly StaffingRule[]; };
const midday=[{startMinutes:720,endMinutes:960},{startMinutes:1020,endMinutes:1320}];
const holiday=[{startMinutes:840,endMinutes:1320}];
const workHours: WorkHoursConfig = { perWeekday:{ monday:midday,tuesday:[],wednesday:midday,thursday:midday,friday:midday,saturday:midday,sunday:holiday }, holiday, closedWeekdays:{monday:false,tuesday:true,wednesday:false,thursday:false,friday:false,saturday:false,sunday:false} };
const rules: readonly StaffingRule[] = [
 {priority:"required",label:"Tối thiểu 1 Phục Vụ và 1 Bếp/Sushi",when:"12:00–16:00 và 17:00–22:00",minStaff:2,maxStaff:Infinity,scaled:false,windows:clip(720,960)},
 {priority:"coverage",label:"Tăng cường giờ cao điểm tối",when:"18:00–20:00",minStaff:4,maxStaff:Infinity,scaled:false,windows:clip(1080,1200)},
];
export const STORES: StoreConfig[]=[{id:"zaiko",name:"Zaiko Premium Sushi & Asian Kitchen",shortName:"Zaiko",address:"Friedrich Ebert Strasse 49 - 42103 Wuppertal",sampleEmployees:zaikoEmployees,workHours,staffingRules:rules,demandProfile:[{startMinutes:720,endMinutes:960,level:0.8,label:"Trưa"},{startMinutes:1020,endMinutes:1080,level:1,label:"Mở cửa tối"},{startMinutes:1080,endMinutes:1200,level:2,label:"Cao điểm"},{startMinutes:1200,endMinutes:1320,level:1.2,label:"Tối"}],dayWeights:{monday:1.1,tuesday:0,wednesday:1.1,thursday:1.1,friday:1.6,saturday:1.7,sunday:1.5},notes:"Ngày đông: Thứ 2, Thứ 6, Thứ 7, Chủ nhật. Doanh thu khoảng 1.800–3.800 €. Cuối tuần ưu tiên đủ người, chủ yếu buổi tối; chủ có mặt khi tiệm hoạt động."}];
export const DEFAULT_STORE_ID=STORES[0].id;
const STORE_KEY="zaiko-app:store";
export function loadStoreId(){try{const saved=localStorage.getItem(STORE_KEY);if(saved&&STORES.some(s=>s.id===saved))return saved;}catch{} return DEFAULT_STORE_ID;}
export function saveStoreId(id:string){try{localStorage.setItem(STORE_KEY,id);}catch{}}
export function storeById(id:string){return STORES.find(s=>s.id===id)??STORES[0];}
export function withSharedPersonDefaults(employees:Employee[],_store:StoreConfig){return employees;}
export function initialScheduleFor(store:StoreConfig):Schedule{return {companyName:store.name,address:store.address,year:2026,month:11,workHours:structuredClone(store.workHours!),dateOverrides:[],employees:store.sampleEmployees(),shifts:[]};}
