/* global __dirname require */

import { __ } from 'embark-i18n';
import { creatorDefaults, makeCreatorMain } from 'embark-init';
import cloneDeep from 'lodash.clonedeep';
import { join } from 'path';

const pkgJsonPath = join(__dirname, "..", "package.json");
const pkgJson = require(pkgJsonPath);
const version = pkgJson.version;

const creator = cloneDeep(creatorDefaults);
creator.extraHelp = () => {
  console.log('');
  console.log('EXTRA HELP SECTION FOR react-dapp');
};
creator.version = version;

delete creator.init.options.contractsOnly;
delete creator.init.options.simple;
delete creator.init.presets.contractsOnly;
const defaultPreset = '@embarklabs/dapps-presets-react-boilerplate';
creator.init.presets.default = `${defaultPreset}@${pkgJson.devDependencies[defaultPreset]}`;
const demoPreset = '@embarklabs/dapps-presets-react-demo';
creator.init.presets.demo = `${demoPreset}@${pkgJson.devDependencies[demoPreset]}`;

const subcreator = 'create-react-app';
creator.subcreator.abbrev = 'cra';
creator.subcreator.command = ['{{subcreator.package}}', [2], {abc:123}];
creator.subcreator.name = subcreator;
creator.subcreator.package = '{{subcreator.name}}@{{subcreator.version}}';
creator.subcreator.version = pkgJson.indirect.dependencies[subcreator];

// const subcreator = '@angular/cli';
// creator.subcreator.abbrev = 'ng';
// creator.subcreator.command = ['-p', '{{subcreator.package}}', 'ng', 'new'];
// creator.subcreator.name = subcreator;
// creator.subcreator.package = '{{subcreator.name}}@{{subcreator.version}}';
// creator.subcreator.version = pkgJson.indirect.dependencies[subcreator];

export const main = makeCreatorMain(creator);
