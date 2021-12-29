import { Values } from './values.ts';
import { ContextOptions } from './context-options.ts';

export interface DataOptions {
  values?: Values;
  contexts?: ContextOptions[];
}
