import { DataOptions } from './data/data-options.ts';
import { FormattingContext } from './data/formatting-context.ts';
import { Values } from './data/values.ts';

import { isObject } from './utils.ts';

export class Translator {
  protected data?: DataOptions;
  protected globalContext!: FormattingContext;
  
  protected extension?: (
    text: string | number, 
    num?: number, 
    formatting?: FormattingContext, 
    data?: Values
  ) => string | number;

  constructor() {
    this.resetContext();
  }

  static create(data: DataOptions) {
    const translator = new Translator();

    translator.add(data);

    return translator;
  }

  translate(
    text: string | number, 
    defaultNumOrFormatting?: number | FormattingContext, 
    numOrFormattingOrContext?: number | FormattingContext,
    formattingOrContext?: FormattingContext    
  ) {
    let num: number | undefined;
    let formatting: FormattingContext | undefined;    
    let context: FormattingContext = this.globalContext;

    if(isObject(defaultNumOrFormatting)) {
      formatting = defaultNumOrFormatting as FormattingContext;
      
      if(isObject(numOrFormattingOrContext)) {
        context = numOrFormattingOrContext as FormattingContext;
      }
    } else if(typeof defaultNumOrFormatting === 'number') {
      num = defaultNumOrFormatting;
      formatting = numOrFormattingOrContext as FormattingContext;

      if(formattingOrContext) {
        context = formattingOrContext;
      }
    } else {
      if(typeof numOrFormattingOrContext === 'number') {
        num = numOrFormattingOrContext;
        formatting = formattingOrContext;
      } else {
        formatting = numOrFormattingOrContext;
        
        if(formattingOrContext) {
          context = formattingOrContext;
        }
      }
    }

    return this.translateText(text, num, formatting, context);
  } 
  
  add(data: DataOptions) {
    if(!this.data) {
      this.data = data;
    } else {
      if(data.values && this.data.values) {
        for(const key of Object.keys(data.values)) {
          this.data.values[key] = data.values[key];
        }
      }
  
      if(data.contexts && this.data.contexts) {
        for(const context of data.contexts) {
          this.data.contexts.push(context);
        }
      }
    }
  }

  setContext(key: string, value: string) {
    this.globalContext[key] = value;
  }

  extend(
    extension: (
      text: string | number, 
      num?: number, 
      formatting?: FormattingContext, 
      data?: Values
    ) => string | number
  ) {
    this.extension = extension;
  }

  clearContext(key: string) {
    delete this.globalContext[key];
  }

  reset() {
    this.resetData();
    this.resetContext();
  }

  resetData() {
    this.data = {
      values: {},
      contexts: []
    };
  }

  resetContext() {
    this.globalContext = {};
  }

  translateText(
    text: string | number, 
    num?: number, 
    formatting?: FormattingContext, 
    context?: FormattingContext
  ) {
    context = context || this.globalContext;

    if(!this.data) {
      return this.useOriginalText('' + text, num, formatting);
    }

    const contextData = this.getContextData(this.data, context);

    let result: string | null = null;
    
    if(contextData) {
      result = this.findTranslation(text, num, formatting, contextData?.values);
    }

    if(result === null) {
      result = this.findTranslation(text, num, formatting, this.data.values);
    }    

    if(result === null)  {
      result = this.useOriginalText('' + text, num, formatting);
    }

    return result;  
  }

  protected findTranslation(
    text: string | number,
    num?: number,
    formatting?: FormattingContext,
    data?: Values
  ) {
    let value = data?.[text];

    if(value === undefined) {
      return null;
    }

    if(typeof value === 'object' && !Array.isArray(value)) {
      if(this.extension) {
        value = '' + this.extension(text, num, formatting, value);
        value = this.applyNumbers(value, num || 0);

        return this.applyFormatting(value, formatting);
      } else {
        return this.useOriginalText('' + text, num, formatting);
      }
    }  

    if(num === undefined && typeof value === 'string') {
      return this.applyFormatting(value, formatting);
    } else if(value instanceof Array) {               
      for(const triple of value) {
        if(
          num === undefined && triple[0] === null && triple[1] === null || 
          num !== undefined && (
            triple[0] !== null && num >= triple[0] && (triple[1] === null || num <= triple[1]) || 
            triple[0] === null && triple[1] && num <= triple[1]
          )
        ) {
          const numVal = num || 0;
          const textVal = '' + (triple[2] ?? '');          

          const result = this.applyNumbers(textVal, numVal);

          return this.applyFormatting(result, formatting);
        }
      }
    }

    return null;
  }

  protected applyNumbers(str: string, num: number) {
    str = str.replace('-%n', '' + -num);
    str = str.replace('%n', '' + num);

    return str;
  }

  protected applyFormatting(text: string, formatting?: FormattingContext) {
    if(formatting) {
      for(const key of Object.keys(formatting)) {
        const regex = new RegExp(`%{${key}}`, 'g');
        text = text.replace(regex, formatting[key]);
      }
    }

    return text;
  }

  protected getContextData(data: DataOptions, context: FormattingContext) {
    if(!data.contexts) {
      return null;
    }

    for(const ctx of data.contexts) {
      let equal = true;

      for(const key of Object.keys(ctx.matches)) {
        const value = ctx.matches[key];

        equal = equal && value === context[key];
      }

      if(equal) {
        return ctx;
      }
    }

    return null;
  }

  protected useOriginalText(text: string, num?: number, formatting?: FormattingContext) {
    if(num === undefined) {
      return this.applyFormatting(text, formatting);
    }

    return this.applyFormatting(text.replace('%n', '' + num), formatting);
  }
}
