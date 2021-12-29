export interface Values {
  [ind: string]: 
    string | 
    number |
    Array<Array<string | number | null>> | 
    {[key: string]: string};
}
