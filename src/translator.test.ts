import { assertEquals } from 'https://deno.land/std@0.119.0/testing/asserts.ts';

import { Values } from './data/values.ts';
import { ContextOptions } from './data/context-options.ts';
import { FormattingContext } from './data/formatting-context.ts';

import { Translator } from './translator.ts';

Deno.test('should translate "Hello"', () => {
  const key = 'Hello';
  const value = 'Hello translated';

  const values: Values = {};

  values[key] = value;

  const translator = Translator.create({ values });

  const actual = translator.translate(key);

  assertEquals(
    actual, 
    value, 
    `Translation of "${key}" should be "${value}" but "${actual}"`
  );
});

Deno.test('should translate plural text', () => {
  const key = '%n comments';
  
  const zeroComments = '0 comments';
  const oneComment = '1 comment';
  const twoComments = '2 comments';
  const tenComments = '10 comments';

  const values: Values = {};

  values[key] = [
    [0, 0, '%n comments'],
    [1, 1, '%n comment'],
    [2, null, '%n comments']
  ];

  const translator = Translator.create({ values });

  let actual = translator.translate(key, 0);

  assertEquals(
    actual, 
    zeroComments, 
    `Translation of "${key}" with 0 should be "${zeroComments}" but "${actual}"`
  );

  actual = translator.translate(key, 1);

  assertEquals(
    actual, 
    oneComment, 
    `Translation of "${key}" with 1 should be "${oneComment}" but "${actual}"`
  );

  actual = translator.translate(key, 2);

  assertEquals(
    actual, 
    twoComments, 
    `Translation of "${key}" with 2 should be "${twoComments}" but "${actual}"`
  );

  actual = translator.translate(key, 10);

  assertEquals(
    actual, 
    tenComments, 
    `Translation of "${key}" with 10 should be "${tenComments}" but "${actual}"`
  );
});


Deno.test('should translate plural text with negative number', () => {
  const key = 'Due in %n days';

  const dueTenDaysAgo = 'Due 10 days ago';
  const dueTwoDaysAgo = 'Due 2 days ago';
  const dueYesterday = 'Due Yesterday';
  const dueToday = 'Due Today';
  const dueTomorrow = 'Due Tomorrow';
  const dueInTwoDays = 'Due in 2 days';
  const dueInTenDays = 'Due in 10 days';

  const values: Values = {};

  values[key] = [
    [null, -2, "Due -%n days ago"],
    [-1, -1, "Due Yesterday"],
    [0, 0, "Due Today"],
    [1, 1, "Due Tomorrow"],
    [2, null, "Due in %n days"]
  ];

  const translator = Translator.create({ values });

  let actual = translator.translate(key, -10);

  assertEquals(
    actual, 
    dueTenDaysAgo, 
    `Translation of "${key}" with -10 should be "${dueTenDaysAgo}" but "${actual}"`
  );

  actual = translator.translate(key, -2);

  assertEquals(
    actual, 
    dueTwoDaysAgo, 
    `Translation of "${key}" with -10 should be "${dueTwoDaysAgo}" but "${actual}"`
  );

  actual = translator.translate(key, -1);

  assertEquals(
    actual, 
    dueYesterday, 
    `Translation of "${key}" with -10 should be "${dueYesterday}" but "${actual}"`
  );

  actual = translator.translate(key, 0);

  assertEquals(
    actual, 
    dueToday, 
    `Translation of "${key}" with 0 should be "${dueToday}" but "${actual}"`
  );

  actual = translator.translate(key, 1);

  assertEquals(
    actual, 
    dueTomorrow, 
    `Translation of "${key}" with 1 should be "${dueTomorrow}" but "${actual}"`
  );

  actual = translator.translate(key, 2);

  assertEquals(
    actual, 
    dueInTwoDays, 
    `Translation of "${key}" with 1 should be "${dueInTwoDays}" but "${actual}"`
  );

  actual = translator.translate(key, 10);

  assertEquals(
    actual, 
    dueInTenDays, 
    `Translation of "${key}" with 1 should be "${dueInTenDays}" but "${actual}"`
  );
});

Deno.test('should translate text with formatting', () => {
  const key = 'Welcome %{name}';
  const value = 'Welcome John';

  const translator = new Translator();

  const actual = translator.translate(key, {
    name: 'John'
  });

  assertEquals(
    actual, 
    value, 
    `Translation of "${key}" with name = "John" should be "${value}" but "${actual}"`
  );
});

Deno.test('should translate text using contexts', () => {
  const key = '%{name} updated their profile';

  const johnValue = 'John updated his profile';
  const janeValue = 'Jane updated her profile';

  const maleValues: Values = {};

  maleValues[key] = '%{name} updated his profile';

  const femaleValues: Values = {};

  femaleValues[key] = '%{name} updated her profile';

  const contexts: ContextOptions[] = [{
    matches: {
      gender: 'male'
    },
    values: maleValues
  }, {
    matches: {
      gender: 'female'
    },
    values: femaleValues
  }];

  const translator = Translator.create({ contexts });

  let actual = translator.translate(
    key, 
    {
      name: 'John'
    },
    {
      gender: 'male'
    }
  );

  assertEquals(
    actual, 
    johnValue, 
    `Translation of "${key}" should be "${johnValue}" but "${actual}"`
  );

  actual = translator.translate(
    key,
    {
      name: 'Jane'
    }, 
    {
      gender: 'female'
    }
  );

  assertEquals(
    actual, 
    janeValue, 
    `Translation of "${key}" should be "${janeValue}" but "${actual}"`
  );
});

Deno.test('should translate plural text using contexts', () => {
  const key = '%{name} uploaded %n photos to their %{album} album';

  const johnValue = `John uploaded 1 photo to his Buck's Night album`;
  const janeValue = `Jane uploaded 4 photos to her Hen's Night album`;

  const maleValues: Values = {};

  maleValues[key] = [
    [0, 0, '%{name} uploaded %n photos to his %{album} album'],
    [1, 1, '%{name} uploaded %n photo to his %{album} album'],
    [2, null, '%{name} uploaded %n photos to his %{album} album']
  ];

  const femaleValues: Values = {};

  femaleValues[key] = [
    [0, 0, '%{name} uploaded %n photos to her %{album} album'],
    [1, 1, '%{name} uploaded %n photo to her %{album} album'],
    [2, null, '%{name} uploaded %n photos to her %{album} album']
  ];

  const contexts: ContextOptions[] = [{
    matches: {
      gender: 'male'
    },
    values: maleValues
  }, {
    matches: {
      gender: 'female'
    },
    values: femaleValues
  }];

  const translator = Translator.create({ contexts });

  let actual = translator.translate(
    key, 1,
    {
      name: 'John',
      album: `Buck's Night`
    },
    {
      gender: 'male'
    }
  );

  assertEquals(
    actual, 
    johnValue, 
    `Translation of "${key}" should be "${johnValue}" but "${actual}"`
  );

  actual = translator.translate(
    key, 4,
    {
      name: 'Jane',
      album: `Hen's Night`
    }, 
    {
      gender: 'female'
    }
  );

  assertEquals(
    actual, 
    janeValue, 
    `Translation of "${key}" should be "${janeValue}" but "${actual}"`
  );
});

Deno.test('should translate plural text using extension', () => {
  const key = '%n results';

  const zeroResults = 'нет результатов';
  const oneResult = '1 результат';
  const elevenResults = '11 результатов';
  const fourResults = '4 результата';
  const results = '101 результат';

  const values: Values = {};

  values[key] = {
    'zero': 'нет результатов',
    'one': '%n результат',
    'few': '%n результата',
    'many': '%n результатов',
    'other': '%n результаты'
  };

  const translator = Translator.create({ values });

  function getPluralisationKey(num?: number) {
    if (!num) {
      return 'zero'
    }

    if (num % 10 == 1 && num % 100 != 11) {
      return 'one'
    }

    if ([2, 3, 4].indexOf(num % 10) >= 0 
      && [12, 13, 14].indexOf(num % 100) < 0) {
      return 'few'
    }

    if (num % 10 == 0 || [5, 6, 7, 8, 9].indexOf(num % 10) >= 0 
      || [11, 12, 13, 14].indexOf(num % 100) >= 0) {
      return 'many'
    }

    return 'other'
  }
  
  function russianExtension(text: string | number, num?: number, formatting?: FormattingContext, data?: Values){
    let key = getPluralisationKey(num);

    return data?.[key] as string | number;
  }

  translator.extend(russianExtension);

  let actual = translator.translate(key, 0);

  assertEquals(
    actual, 
    zeroResults, 
    `Translation of "${key}" with 1 should be "${zeroResults}" but "${actual}"`
  );

  actual = translator.translate(key, 1);

  assertEquals(
    actual, 
    oneResult, 
    `Translation of "${key}" with 1 should be "${oneResult}" but "${actual}"`
  );

  actual = translator.translate(key, 11);

  assertEquals(
    actual, 
    elevenResults, 
    `Translation of "${key}" with 1 should be "${elevenResults}" but "${actual}"`
  );

  actual = translator.translate(key, 4);

  assertEquals(
    actual, 
    fourResults, 
    `Translation of "${key}" with 1 should be "${fourResults}" but "${actual}"`
  );

  actual = translator.translate(key, 101);

  assertEquals(
    actual, 
    results, 
    `Translation of "${key}" with 1 should be "${results}" but "${actual}"`
  );
});
