import { z } from 'zod';
import { configurationSchema, defaultConfiguration } from '../../shared/src/configuration';
const projectSchema = z.object({id:z.uuid(),name:z.string(),updated:z.string(),configuration:configurationSchema});
export type Project = z.infer<typeof projectSchema>;
const key = 'forge.projects.v1';
export function loadProjects(): Project[] {
 const value = localStorage.getItem(key);
 if (!value) return [];
 return z.array(projectSchema).parse(JSON.parse(value));
}
export function saveProjects(projects:Project[]) {localStorage.setItem(key,JSON.stringify(projects));}
export function newProject(): Project {return {id:crypto.randomUUID(),name:'Untitled application',updated:new Date().toISOString(),configuration:defaultConfiguration()};}
