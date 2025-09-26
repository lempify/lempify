const GRID_CSS = `
  grid 
  grid-cols-1 

  @lg:grid-cols-2 

  @2xl:grid-cols-3
`;

const GRID_ITEM_CSS = `
  p-4

  border-t border-r-0 border-neutral-300 dark:border-neutral-700 

  @max-lg:empty:border-t-0 
  @max-lg:empty:hidden 

  @lg:border-r 
  @lg:@max-2xl:[&:nth-child(2n)]:border-r-0 
  
  @2xl:[&:nth-child(3n)]:border-r-0 

  relative 
`;

export function Grid({
  children,
  className = '',
  childrenLength = 0,
}: {
  children?: React.ReactNode;
  className?: string;
  childrenLength?: number;
}) {
  const maxCols = 3;
  const emptyItemsCount =
    childrenLength % maxCols > 0 ? maxCols - (childrenLength % maxCols) : 0;
  const shouldHideEmptyItems = emptyItemsCount === 2;

  return (
    <div className={`@container ${className}`}>
      <ul className={GRID_CSS}>
        <>
          {children}
          {emptyItemsCount > 0 &&
            Array.from({ length: emptyItemsCount }).map((_, index) => (
              <GridItem
                key={index}
                className={
                  shouldHideEmptyItems ? '@lg:@max-2xl:empty:hidden' : ''
                }
              />
            ))}
        </>
      </ul>
    </div>
  );
}

export function GridItem({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const combinedClassName = `${GRID_ITEM_CSS} ${className}`;
  return <li className={combinedClassName}>{children}</li>;
}
