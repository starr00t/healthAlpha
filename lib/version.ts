import packageJson from '../package.json';

export const APP_VERSION = packageJson.version;
export const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

export function getVersionInfo() {
  return {
    version: APP_VERSION,
    buildTime: BUILD_TIME,
    environment: process.env.NODE_ENV,
  };
}
