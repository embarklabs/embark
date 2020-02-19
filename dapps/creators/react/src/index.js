/* global __dirname require */

import { __ } from 'embark-i18n';
import { creatorDefaults, makeCreatorMain } from 'embark-init';
import cloneDeep from 'lodash.clonedeep';
import { join } from 'path';

const pkgJsonPath = join(__dirname, "..", "package.json");
const pkgJson = require(pkgJsonPath);
const version = pkgJson.version;

const creator = cloneDeep(creatorDefaults);
creator.version = version;
delete creator.init.options.contractsOnly;
delete creator.init.options.simple;
delete creator.init.presets.contractsOnly;
const defaultPreset = '@embarklabs/dapps-presets-react-boilerplate';
creator.init.presets.default = `${defaultPreset}@${pkgJson.devDependencies[defaultPreset]}`;
const demoPreset = '@embarklabs/dapps-presets-react-demo';
creator.init.presets.demo = `${demoPreset}@${pkgJson.devDependencies[demoPreset]}`;

const subcreatorName = 'create-react-app';
creator.subcreator.abbrev = 'cra';
creator.subcreator.command = '{{subcreator.package}}';
creator.subcreator.name = subcreatorName;
creator.subcreator.package = '{{subcreator.name}}@{{subcreator.version}}';
creator.subcreator.version = pkgJson.indirect.dependencies[subcreatorName];

// const subcreatorName = '@angular/cli';
// creator.subcreator.abbrev = 'ng';
// creator.subcreator.command = ['-p', '{{subcreator.package}}', 'ng', 'new'];
// creator.subcreator.name = subcreatorName;
// creator.subcreator.package = '{{subcreator.name}}@{{subcreator.version}}';
// creator.subcreator.version = pkgJson.indirect.dependencies[subcreatorName];

export const main = makeCreatorMain(creator);
