import { __ } from 'embark-i18n';
import { join } from 'path';

const pkgJsonPath = join(__dirname, "..", "package.json");
const pkgJson = require(pkgJsonPath);

const contractsOnlyPreset = '@embarklabs/dapps-presets-init-boilerplate';
const defaultPreset = '@embarklabs/dapps-presets-init-boilerplate';

const defaultInitContractsOnlyPreset = `${contractsOnlyPreset}@${pkgJson.devDependencies[contractsOnlyPreset]}`;
const defaultInitDefaultPreset = `${defaultPreset}@${pkgJson.devDependencies[defaultPreset]}`;

const defaultInitExtraHelp = (`
SIMPLE USAGE

  $ {{init.embarkInit}} [options]


console.log('');
console.log('SIMPLE USAGE:');
console.log('');
console.log('    ', \`{{init.embarkInit}} [options]\`);
console.log('');
console.log(
  'Initialization is performed in the current working directory;',
  'will first run \`npm init\` if no package.json is present.'
);

console.log('');
console.log('WITH CREATOR:');
console.log('');
console.log('    ', \`{{init.embarkInit}} [creator] [options] [-- [extra-options]]\`);
console.log('');
console.log(
  'A creator is a name such as "react-dapp".',
  'Options to the left of the creator are ignored.',
  'Any options to the right of "--" are passed to the underlying tool,',
  'e.g. create-react-app, and will override conflicting options computed by the creator.'
);
console.log('');
console.log(
  'Creator names are resolved to packages by prepending "@embarklabs/create-", then trying with "embark-", and finally using the bare name.'
);
console.log('');
console.log(
  'Example: "react-dapp" resolves to "@embarklabs/create-react-dapp", and the following are equivalent:'
);
console.log('');
console.log('    ', \`{{init.embarkInit}} react-dapp mydapp [options] [-- [extra-options]]\`);
console.log('');
console.log('    ', \`npx @embarklabs/crete-react-dapp mydapp [options] [-- [extra-options]]\`);
console.log('');
console.log('To see the help output of a creator do:');
console.log('');
console.log('    ', \`{{init.embarkInit}} [creator] --help\`);
console.log('');
console.log('To see the help output of a creator\'s underlying tool do:');
console.log('');
console.log('    ', \`{{init.embarkInit}} [creator] -- --help\`);
`).trim();

const defaultInitOptions = {
  contractsOnly: {
    description: [
      __('create a barebones project meant only for contract development'),
      ',',
      '\n                    ',
      __('alias for %s', '--preset {{init.presets.contractsOnly}}')
    ].join(''),
    long: 'contracts-only'
  },

  force: {
    description: __('overwrite existing files'),
    long: 'force',
    short: 'f'
  },

  locale: {
    default: 'en',
    description: __('language to use'),
    long: 'locale [locale]'
  },

  preset: {
    default: `{{init.presets.default}}`,
    description: [
      __('preset to use'),
      ', ',
      __('can be any valid package specifier'),
      '\n                   '
    ].join(''),
    long: 'preset [pkg]',
    short: 'p'
  },

  simple: {
    description: __('alias for %s', '--contracts-only'),
    long: 'simple'
  },

  template: {
    description: __('alias for %s', '--preset [pkg]'),
    long: 'template [pkg]'
  },

  yarn: {
    description: __('use yarn instead of npm'),
    long: 'yarn'
  },

  yes: {
    description: __('skip prompts, accept defaults for unspecified options'),
    long: 'yes',
    short: 'y'
  }
};

export const initDefaults = {
  extraHelp: defaultInitExtraHelp,
  options: defaultInitOptions,
  presets: {
    contractsOnly: defaultInitContractsOnlyPreset,
    default: defaultInitDefaultPreset
  }
};

const defaultCreatorDemoPreset = null;
const defaultCreatorExtraHelp = (`
THIS IS GREAT STUFF
`).trim();

const defaultCreatorOptions = {
  demo: {
    description: [
      __('create a working dapp with a SimpleStorage contract'),
      ', ',
      __('alias for %s', '--preset {{init.presets.demo}}')
    ].join(''),
    long: 'demo'
  },

  noInit: {
    description: [
      __('only run %s', '{{subcreator.name}}'),
      ', ',
      __('do not initialize embark-related files')
    ].join(''),
    long: 'no-init'
  },

  overrideSubcreator: {
    default: '{{subcreator.package}}',
    description: [
      __('specify the %s', '{{subcreator.name}}'),
      ' ',
      __('package'),
      ', ',
      __('can be any valid package specifier'),
      ', e.g. ',
      __('to use a different version or fork')
    ].join(''),
    long: '{{subcreator.abbrev}}-package [pkg]'
  }
};

const defaultSubcreatorAbbrev = null;
const defaultSubcreatorCommand = [];
const defaultSubcreatorName = null;
const defaultSubcreatorOptions = [];
const defaultSubcreatorPackage = null;
const defaultSubcreatorVersion = null;

const subcreatorDefaults = {
  abbrev: defaultSubcreatorAbbrev,
  command: defaultSubcreatorCommand,
  name: defaultSubcreatorName,
  options: defaultSubcreatorOptions,
  package: defaultSubcreatorPackage,
  version: defaultSubcreatorVersion
};

export const creatorDefaults = {
  extraHelp: defaultCreatorExtraHelp,
  init: {
    options: initDefaults.options,
    presets: {
      demo: defaultCreatorDemoPreset,
      ...initDefaults.presets
    }
  },
  options: defaultCreatorOptions,
  subcreator: subcreatorDefaults,
  version: null
};
