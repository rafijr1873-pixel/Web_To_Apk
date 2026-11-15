import { z } from 'zod';

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const asset = z.uuid().nullable();
const packageName = z.string().min(3).max(150)
  .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/, 'Use a lowercase, dotted Android application ID');
const reserved = new Set(['abstract','assert','boolean','break','byte','case','catch','char','class','const','continue','default','do','double','else','enum','extends','final','finally','float','for','goto','if','implements','import','instanceof','int','interface','long','native','new','package','private','protected','public','return','short','static','strictfp','super','switch','synchronized','this','throw','throws','transient','try','void','volatile','while','true','false','null','_']);
export const applicationIdSchema = packageName.refine(v => v.split('.').every(p => !reserved.has(p)), 'Application ID contains a reserved Java identifier');

export const configurationSchema = z.strictObject({
  schemaVersion: z.literal(1),
  identity: z.strictObject({
    name: z.string().trim().min(1).max(80),
    applicationId: applicationIdSchema,
    versionName: z.string().regex(/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][a-zA-Z0-9.-]+)?$/).max(64),
    versionCode: z.number().int().min(1).max(2100000000),
    description: z.string().max(4000), developer: z.string().max(120),
    icon: asset, adaptiveIcon: asset, notificationIcon: asset,
  }),
  display: z.strictObject({
    orientation: z.enum(['portrait', 'landscape', 'sensor']), orientationLock: z.boolean(),
    theme: z.enum(['light', 'dark', 'system']), fullscreen: z.boolean(), immersive: z.boolean(),
    statusBarColor: color, navigationBarColor: color,
    statusBarVisible: z.boolean(), navigationBarVisible: z.boolean(),
  }),
  splash: z.strictObject({
    image: asset, icon: asset, backgroundColor: color,
    durationMs: z.number().int().min(0).max(10000), loadingIndicator: z.boolean(),
    animation: z.enum(['none', 'fade']),
  }),
  webView: z.strictObject({
    javaScript: z.boolean(), domStorage: z.boolean(), databaseStorage: z.boolean(),
    zoom: z.boolean(), builtInZoomControls: z.boolean(), displayZoomControls: z.boolean(),
    fileUpload: z.boolean(), downloads: z.boolean(), pullToRefresh: z.boolean(),
    geolocation: z.boolean(), externalLinks: z.enum(['browser', 'webview', 'block']),
    userAgent: z.string().max(512).regex(/^[^\r\n]*$/),
    errorPage: asset, cacheMode: z.enum(['default', 'no-cache', 'cache-first', 'cache-only']),
    cookies: z.boolean(), thirdPartyCookies: z.boolean(),
    mixedContent: z.enum(['never', 'compatibility']), safeBrowsing: z.literal(true),
    backBehavior: z.enum(['history-then-confirm', 'history-then-exit', 'confirm']),
    offlineMode: z.enum(['local-assets', 'error-page']),
  }),
  permissions: z.strictObject({camera: z.boolean(), microphone: z.boolean(), location: z.boolean()}),
  native: z.strictObject({
    share: z.boolean(), deepLinks: z.array(z.strictObject({
      scheme: z.literal('https'), host: z.string().regex(/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/),
      pathPrefix: z.string().startsWith('/').max(512),
    })).max(10),
  }),
  build: z.strictObject({
    type: z.enum(['debug', 'release']), minSdk: z.number().int().min(26).max(36),
    targetSdk: z.number().int().min(35).max(36), compileSdk: z.number().int().min(35).max(36),
    architecture: z.enum(['universal', 'arm64-v8a', 'armeabi-v7a']),
    minify: z.boolean(), shrinkResources: z.boolean(),
    signingCredentialId: asset,
  }),
}).superRefine((c, ctx) => {
  const issue = (path: string[], message: string) => ctx.addIssue({code: 'custom', path, message});
  if (c.build.minSdk > c.build.targetSdk || c.build.targetSdk > c.build.compileSdk)
    issue(['build', 'targetSdk'], 'Require minSdk <= targetSdk <= compileSdk');
  if (c.build.type === 'release' && !c.build.signingCredentialId)
    issue(['build', 'signingCredentialId'], 'Release requires an owned signing credential');
  if (c.build.shrinkResources && !c.build.minify)
    issue(['build', 'shrinkResources'], 'Resource shrinking requires R8 minification');
  if (c.webView.geolocation && !c.permissions.location)
    issue(['permissions', 'location'], 'Geolocation requires runtime location permission support');
  if (c.webView.thirdPartyCookies && !c.webView.cookies)
    issue(['webView', 'thirdPartyCookies'], 'Third-party cookies require cookies enabled');
  if (c.webView.displayZoomControls && !c.webView.builtInZoomControls)
    issue(['webView', 'displayZoomControls'], 'Visible controls require built-in zoom controls');
});
export type ApplicationConfiguration = z.infer<typeof configurationSchema>;

export function defaultConfiguration(): ApplicationConfiguration {
  return configurationSchema.parse({
    schemaVersion: 1,
    identity: {name: 'My application', applicationId: 'com.example.myapp', versionName: '1.0.0', versionCode: 1, description: '', developer: '', icon: null, adaptiveIcon: null, notificationIcon: null},
    display: {orientation: 'portrait', orientationLock: false, theme: 'system', fullscreen: false, immersive: false, statusBarColor: '#111827', navigationBarColor: '#111827', statusBarVisible: true, navigationBarVisible: true},
    splash: {image: null, icon: null, backgroundColor: '#111827', durationMs: 0, loadingIndicator: true, animation: 'none'},
    webView: {javaScript: false, domStorage: false, databaseStorage: false, zoom: true, builtInZoomControls: true, displayZoomControls: false, fileUpload: false, downloads: false, pullToRefresh: false, geolocation: false, externalLinks: 'browser', userAgent: '', errorPage: null, cacheMode: 'default', cookies: false, thirdPartyCookies: false, mixedContent: 'never', safeBrowsing: true, backBehavior: 'history-then-confirm', offlineMode: 'local-assets'},
    permissions: {camera: false, microphone: false, location: false},
    native: {share: false, deepLinks: []},
    build: {type: 'debug', minSdk: 26, targetSdk: 35, compileSdk: 35, architecture: 'universal', minify: false, shrinkResources: false, signingCredentialId: null},
  });
}
