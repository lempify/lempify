const gridCss = `
grid 
grid-cols-1 

@lg:grid-cols-2 

@2xl:grid-cols-3
`;

const gridItemCss = `
    p-4

    border-t border-r-0 border-neutral-300 dark:border-neutral-700 

    @lg:border-r 
    @lg:@max-2xl:[&:nth-child(2n)]:border-r-0
    
    @2xl:[&:nth-child(3n)]:border-r-0

    relative 
`;

export function Grid({
  children,
  className = '',
  maxCols = 3,
  childrenLength = 0,
}: {
  children?: React.ReactNode;
  className?: string;
  maxCols?: number;
  childrenLength?: number;
}) {
  return (
    <div className={`@container ${className}`}>
      <ul className={gridCss}>
        <>
          {children}
          {Array.from({ length: maxCols - (childrenLength % maxCols) }).map(
            (_, index) => (
              <GridItem key={index} />
            )
          )}
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
  return <li className={`${gridItemCss} ${className}`}>{children}</li>;
}
