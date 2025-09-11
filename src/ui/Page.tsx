import { Fragment } from 'react';
import RouteHeader from './RouteHeader';

export default function Page({
  title,
  description,
  children,
}: {
  title: string;
  description?: string | (() => React.ReactNode);
  children: React.ReactNode;
}) {
  return (
    <Fragment>
      <RouteHeader title={title} description={description} />
      <div className='flex flex-col'>{children}</div>
    </Fragment>
  );
}
