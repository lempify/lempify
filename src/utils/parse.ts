interface ParseCssVarArgs {
    cssVar: string;
    parser?: 'parseInt' | 'parseFloat' | '';
    element: HTMLElement | Element;
  }
  
  export const getCssVar = <T extends string>({
    element,
    cssVar,
  }: ParseCssVarArgs): T => {
    if (element instanceof HTMLElement) {
      return element.style.getPropertyValue(cssVar).trim() as T;
    }
    return '' as T;
  };
  
  export const parsIntCssVar = ({
    cssVar,
    element = document.body,
  }: ParseCssVarArgs) => {
    const cssVariable = getCssVar({ element, cssVar });
    if ('' === cssVariable) {
      return 0;
    }
    return parseInt(cssVariable);
  };
  
  export const parsePercentages = ({
    total,
    startAt = 0,
    percentage = 25,
  }: {
    total: number;
    startAt?: number;
    percentage?: number;
  }): number[] => {
    const percentageIncrement = (total / 100) * percentage;
    const percentageSteps = 100 / percentage;
    return [
      ...[...Array(percentageSteps)].map((_, i) => {
        if (0 === i) {
          return startAt;
        }
        return parseFloat((i * percentageIncrement).toFixed(2)) + startAt;
      }),
      total,
    ];
  };