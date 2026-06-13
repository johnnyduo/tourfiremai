import type { Adapter } from './types';
import { nidnoi } from './nidnoi';
import { travelzeed } from './travelzeed';
import { unithai } from './unithai';
import { upoperation } from './upoperation';

export const adapters: Adapter[] = [nidnoi, travelzeed, unithai, upoperation];
export const enabledAdapters = () => adapters.filter((a) => a.enabled);
