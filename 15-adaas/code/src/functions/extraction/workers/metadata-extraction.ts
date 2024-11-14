import { ExtractorEventType, processTask } from '@devrev/ts-adaas';

import externalDomainMetadata from '../github-extractor/external_domain_metadata.json';
// import externalDomainMetadata from '../../../../metadata.json';

const repos = [
  {
    itemType: 'external_domain_metadata',
  },
];

processTask({
  task: async ({ adapter }) => {
    adapter.initializeRepos(repos);
    await adapter.getRepo('external_domain_metadata')?.push([externalDomainMetadata]);
    await adapter.emit(ExtractorEventType.ExtractionMetadataDone);
  },
  onTimeout: async ({ adapter }) => {
    await adapter.emit(ExtractorEventType.ExtractionMetadataError, {
      error: { message: 'Failed to extract metadata. Lambda timeout.' },
    });
  },
});
