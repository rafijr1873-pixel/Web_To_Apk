import test from 'node:test';
import assert from 'node:assert/strict';
import { configurationSchema, defaultConfiguration } from '../shared/src/configuration.js';
import { assertBuildTransition, buildStates } from '../shared/src/build.js';

test('defaults validate and do not silently enable sensitive capabilities', () => {
 const c = defaultConfiguration();
 assert.equal(configurationSchema.safeParse(c).success, true);
 assert.equal(c.webView.javaScript, false);
 assert.deepEqual(c.permissions, {camera:false, microphone:false, location:false});
 assert.equal(c.webView.safeBrowsing, true);
});
test('defaults are independent copies', () => {
 const a = defaultConfiguration(); a.identity.name = 'changed';
 assert.equal(defaultConfiguration().identity.name, 'My application');
});
for (const id of ['a', 'com..app', '../app', 'com.class.app', 'Com.example.app', 'com.test.$x']) {
 test(`reject invalid application ID ${id}`, () => {
 const c = defaultConfiguration(); c.identity.applicationId = id;
 assert.equal(configurationSchema.safeParse(c).success, false);
 });
}
test('release requires signing reference; passwords are not accepted in config', () => {
 const c = defaultConfiguration(); c.build.type = 'release';
 assert.equal(configurationSchema.safeParse(c).success, false);
 c.build.signingCredentialId = 'b6c60c73-0269-41a4-bf23-d127c71d9450';
 assert.equal(configurationSchema.safeParse(c).success, true);
 assert.equal(configurationSchema.safeParse({...c, password:'secret'}).success, false);
});
test('reject invalid SDK order, shrinking and permission dependencies', () => {
 for (const mutate of [
 (c: ReturnType<typeof defaultConfiguration>) => { c.build.minSdk = 36; },
 (c: ReturnType<typeof defaultConfiguration>) => { c.build.shrinkResources = true; },
 (c: ReturnType<typeof defaultConfiguration>) => { c.webView.geolocation = true; },
 (c: ReturnType<typeof defaultConfiguration>) => { c.webView.thirdPartyCookies = true; },
 ]) { const c = defaultConfiguration(); mutate(c); assert.equal(configurationSchema.safeParse(c).success, false); }
});
test('reject header injection and unrecognized keys', () => {
 const c = defaultConfiguration(); c.webView.userAgent = 'x\r\nInjected: yes';
 assert.equal(configurationSchema.safeParse(c).success, false);
 assert.equal(configurationSchema.safeParse({...defaultConfiguration(), arbitrary: true}).success, false);
});
test('build state machine cannot bypass verification or restart terminal jobs', () => {
 assertBuildTransition('compiling', 'signing'); assertBuildTransition('verifying', 'completed');
 assert.throws(() => assertBuildTransition('compiling', 'completed'));
 for (const terminal of ['completed', 'failed', 'cancelled'] as const)
 for (const next of buildStates) assert.throws(() => assertBuildTransition(terminal, next));
});
