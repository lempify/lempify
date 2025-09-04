import { useLempifyd } from '../context/LempifydContext';
import { cornerBottomLeft, cornerTopRight, pageSection } from './css';
import { Grid, GridItem } from './Grid';
import Heading from './Heading';
import Page from './Page';
import DependenciesItem from './DependenciesItem';

export default function Dashboard() {
  const {
    emit,
    state: {
      services,
      tools,
    },
  } = useLempifyd();

  const servicesArray = Object.entries(services);
  const toolsArray = Object.entries(tools);

  return (
    <Page title={'Dependencies'} description={'Manage all services and tools'}>
      <div className={`${pageSection} ${cornerTopRight}`}>
        <header className='mb-8'>
          <Heading size='h2' title='Services' subheading='Your web services' />
        </header>
        <Grid childrenLength={servicesArray.length}>
          {servicesArray.map(([name, service]) => {
            return (
              <GridItem key={name}>
                <DependenciesItem
                  className={`${service.isRequired ? 'border-red-500' : 'border-yellow-500'}`}
                  dependency={service}
                  emit={emit}
                />
              </GridItem>
            );
          })}
        </Grid>
      </div>
      <div className={`${pageSection} ${cornerBottomLeft}`}>
        <header className='mb-8'>
          <Heading
            size='h2'
            title='Tools'
            subheading='Your development tools'
          />
        </header>
        <Grid childrenLength={toolsArray.length}>
          {toolsArray.map(([name, tool]) => {
            return (
              <GridItem key={name}>
                <DependenciesItem
                  className={`${tool.isRequired ? 'border-red-500' : 'border-yellow-500'}`}
                  dependency={tool}
                  emit={emit}
                />
              </GridItem>
            );
          })}
        </Grid>
      </div>
    </Page>
  );
}
