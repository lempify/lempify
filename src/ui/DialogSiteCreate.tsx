import { FormSiteCreate } from "./FormSiteCreate";
import Heading from "./Heading";
import useSiteManager from "../hooks/useSiteManager";

export default function DialogSiteCreate() {
  const { refresh } = useSiteManager();
  return (
    <div className='flex flex-col gap-2 p-4 h-full overflow-y-auto'>
      <Heading title='Create&nbsp;a&nbsp;new Site' size='h1' align='right' split />
      <FormSiteCreate onRefresh={refresh} fieldPrefix='dialog' />
    </div>
  );
}