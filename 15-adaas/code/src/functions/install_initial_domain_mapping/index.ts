import { installInitialDomainMapping } from '@devrev/ts-adaas';

// import initialDomainMapping from '../extraction/github-extractor/initial_domain_mapping.json';
import initialDomainMapping from '../../../../initial_domain_mapping.json';

const run = async (events: any[]) => {
  for (const event of events) {
    try {
      await installInitialDomainMapping(event, initialDomainMapping);
    } catch (error) {
      console.error('Failed to install initial domain mappings', error);
    }
  }
};

export default run;
