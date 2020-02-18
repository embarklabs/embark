import { __ } from 'embark-i18n';
import { join } from 'path';

const pkgJsonPath = join(__dirname, "..", "package.json");
const pkgJson = require(pkgJsonPath);

const contractsOnlyPreset = '@embarklabs/dapps-presets-init-boilerplate';
const defaultPreset = '@embarklabs/dapps-presets-init-boilerplate';

const defaultInitContractsOnlyPreset = `${contractsOnlyPreset}@${pkgJson.devDependencies[contractsOnlyPreset]}`;
const defaultInitDefaultPreset = `${defaultPreset}@${pkgJson.devDependencies[defaultPreset]}`;

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
  options: defaultInitOptions,
  presets: {
    contractsOnly: defaultInitContractsOnlyPreset,
    default: defaultInitDefaultPreset
  }
};

const defaultCreatorDemoPreset = null;
const defaultCreatorExtraHelp = null;

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
