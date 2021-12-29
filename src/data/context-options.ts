import { Values } from './values.ts';
import { FormattingContext } from './formatting-context.ts';

export interface ContextOptions {
  matches: FormattingContext;
  values: Values;
}
