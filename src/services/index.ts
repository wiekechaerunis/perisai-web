/**
 * Titik masuk data layer. UI mengimpor dari sini saja, tidak dari mock/ atau api/ secara langsung.
 * Ganti ke API nyata: VITE_DATA_SOURCE=api.
 */
import { apiServices } from './api';
import { mockServices } from './mock';
import type { Services } from './types';

export const DATA_SOURCE: 'mock' | 'api' = import.meta.env.VITE_DATA_SOURCE === 'api' ? 'api' : 'mock';

export const services: Services = DATA_SOURCE === 'api' ? apiServices : mockServices;

export * from './types';
export { activityBus } from './activity';
