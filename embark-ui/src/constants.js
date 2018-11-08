export const EMBARK_PROCESS_NAME = 'embark';
export const LOG_LIMIT = 200;
export const ELEMENTS_LIMIT = 200;
export const DARK_THEME = 'dark';
export const LIGHT_THEME = 'light';
export const DEPLOYMENT_PIPELINES = {
  injectedWeb3: 'injectedWeb3',
  embark: 'embark'
};
export const DEFAULT_HOST = process.env.NODE_ENV === 'development' ? 'localhost:8000' : window.location.host;
export const OPERATIONS = {
  MORE: 1,
  LESS: -1
};
