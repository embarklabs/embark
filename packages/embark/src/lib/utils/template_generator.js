import { __ } from 'embark-i18n';
const findUp = require('find-up');
const fs = require('../core/fs.js');
const hostedGitInfo = require('hosted-git-info');
const utils = require('./utils.js');
import { embarkPath, downloadFile, joinPath, runCmd, errorMessage } from 'embark-utils';
const semver = require('semver');
const {promisify} = require('util');
const {execSync} = require('child_process');

const REPLACEMENTS = {
  'git@github.com/': 'git@github.com:',
  'git@bitbucket.org/': 'git@bitbucket.org:',
  'git@gitlab.com/': 'git@gitlab.com:',
  'github.com/': '',
  'bitbucket.org/': 'bitbucket:',
  'gitlab.com/': 'gitlab:'
};

class TemplateGenerator {
  constructor(templateName) {
    this.templateName = templateName;
  }

  checkPathExists(fspath) {
    if (fs.existsSync(fspath)) {
      console.error(`${fspath} already exists, will not overwrite`.red);
      process.exit(1);
    }
  }

  async download(url, tmpFilePath, browse) {
    console.log(__('Installing template from ' + browse).green);
    console.log(__('Downloading template...').green);
    fs.mkdirpSync(utils.dirname(tmpFilePath));
    try {
      await promisify(downloadFile)(url, tmpFilePath);
    } catch (e) {
      console.error(errorMessage(e).red);
      throw e;
    }
  }

  downloadFailed() {
    console.error('Does the template really exist?'.red);
    console.error(`Embark's supported templates: https://embark.status.im/templates/`.green);
    process.exit(1);
  }

  async downloadAndGenerate(uri, destinationFolder, name) {
    const fspath = joinPath(destinationFolder, name);
    this.checkPathExists(fspath);
    let ext;
    try {
      ext = await this.getExternalProject(uri);
    } catch (e) {
      console.error(errorMessage(e).red);
      process.exit(1);
    }
    let {url, filePath, browse} = ext;
    let tmpFilePath = fs.tmpDir(filePath);
    try {
      try {
        await this.download(url, tmpFilePath, browse);
      } catch (err) {
        let {url_fallback, filePath_fallback, browse_fallback, embarkVersion} = ext;
        if (url_fallback) {
          console.log(__('Retrying with the default branch...').yellow);
          console.log((__(`It may not be compatible with your Embark version`) + ` ${embarkVersion}`).yellow);
          tmpFilePath = fs.tmpDir(filePath_fallback);
          await this.download(url_fallback, tmpFilePath, browse_fallback);
        } else {
          throw new Error();
        }
      }
    } catch (e) {
      return this.downloadFailed();
    }
    this.extract(tmpFilePath, fspath, () => {
      this.installTemplate(fspath, name, true);
    });
  }

  extract(filePath, destinationFolder, cb = () => {}) {
    utils.extractZip(
      filePath,
      destinationFolder,
      {
        map: file => {
          let fixed_path = file.path.split('/');
          fixed_path.shift(); // remove first directory
          file.path = joinPath(...fixed_path);
          return file;
        }
      },
      cb
    );
  }

  generate(destinationFolder, name) {
    const fspath = joinPath(destinationFolder, name);
    this.checkPathExists(fspath);

    console.log(__('Initializing Embark template...').green);

    const templatePkg = `embark-dapp-template-${this.templateName}`;
    let templateSpecifier;
    if (this.monorepoRootPath) {
      templateSpecifier = joinPath(
        this.monorepoRootPath, 'dapps/templates', this.templateName
      );
    } else {
      const version = fs.readJSONSync(embarkPath('package.json')).version;
      templateSpecifier = `${templatePkg}@^${version}`;
    }

    const tmpDir = require('fs-extra').mkdtempSync(
      joinPath(require('os').tmpdir(), `${this.templateName}-`)
    );

    execSync(`npm pack ${templateSpecifier}`, {cwd: tmpDir, stdio: 'ignore'});
    const packed = utils.filesMatchingPattern(
      [joinPath(tmpDir, '*.tgz')]
    )[0];

    this.extract(packed, fspath, () => {
      this.installTemplate(
        fspath,
        name,
        true,
        () => {
          if (name === 'embark_demo') {
            console.log('-------------------'.yellow);
            console.log(__('Next steps:').green);
            console.log(('-> ' + ('cd ' + fspath).bold.cyan).green);
            console.log('-> '.green + 'embark run'.bold.cyan);
            console.log(__('For more info go to http://embark.status.im').green);
          }
        }
      );
    });
  }

  get monorepoRootPath() {
    if (this._monorepoRootPath === undefined) {
      let monorepoRootPath = null;
      const maybeMonorepoRootPath = fs.existsSync(
        embarkPath('../../packages/embark')
      );
      if (maybeMonorepoRootPath) {
        const lernaJsonPath = findUp.sync('lerna.json', {cwd: embarkPath()});
        if (lernaJsonPath) {
          monorepoRootPath = utils.dirname(lernaJsonPath);
        }
      }
      this._monorepoRootPath = monorepoRootPath;
    }
    return this._monorepoRootPath;
  }

  installTemplate(templatePath, name, installPackages, cb) {
    utils.cd(templatePath);

    const pkgJson = fs.readJSONSync('./package.json');
    if (!(/demo/).test(name)) {
      delete pkgJson.repository;
      delete pkgJson.bugs;
      pkgJson.description = '';
      delete pkgJson.homepage;
      pkgJson.version = '0.0.1';
    }
    if (pkgJson.devDependencies) {
      delete pkgJson.devDependencies['embark'];
      delete pkgJson.devDependencies['embark-reset'];
      delete pkgJson.devDependencies['npm-run-all'];
      delete pkgJson.devDependencies['rimraf'];
    }
    delete pkgJson.files;
    pkgJson.name = name;
    if (!pkgJson.scripts) pkgJson.scripts = {};
    delete pkgJson.scripts.ci;
    delete pkgJson.scripts.clean;
    delete pkgJson.scripts.package;
    delete pkgJson.scripts.qa;
    delete pkgJson.scripts.reset;
    pkgJson.scripts.test = 'embark test';
    fs.writeFileSync('package.json', JSON.stringify(pkgJson, null, 2));

    if (!(/demo/).test(name) && fs.existsSync('README.md')) {
      fs.removeSync('README.md');
    }
    if (fs.existsSync('dot.gitignore')) {
      fs.moveSync('dot.gitignore', '.gitignore', {overwrite: true});
    }
    if (fs.existsSync('dot.npmrc')) {
      fs.moveSync('dot.npmrc', '.npmrc', {overwrite: true});
    }

    if (installPackages) {
      console.log(__('Installing packages...').green);
      if (this.monorepoRootPath) {
        let links = [];
        execSync(
          'npx lerna list --long --parseable',
          {cwd: this.monorepoRootPath,
           stdio: ['ignore', 'pipe', 'ignore']}
        )
          .toString()
          .trim()
          .split('\n')
          .forEach(line => {
            const [pkgDir, pkgName] = line.split(':');
            if ((pkgJson.dependencies && pkgJson.dependencies[pkgName]) ||
                (pkgJson.devDependencies && pkgJson.devDependencies[pkgName])) {
              links.push(pkgName);
              const cmd = 'yarn unlink && yarn link || yarn link';
              console.log(`cd ${pkgDir}; ${cmd}`.yellow);
              execSync(cmd, {cwd: pkgDir, stdio: 'ignore'});
            }
          });
        if (links.length) {
          const cmd = `yarn link ${links.join(' ')}`;
          console.log(`cd ${templatePath}; ${cmd}`.yellow);
          execSync(cmd, {stdio: 'ignore'});
        }
      }

      const installCmd = this.monorepoRootPath ? 'yarn install' : 'npm install';

      runCmd(installCmd, {exitOnError: false}, (err) => {
        if (err) {
          console.error(__(`Could not install dependencies. Try running \`${installCmd}\` inside the project directory.`).red);
        }
        console.log(__('Init complete').green);
        console.log('\n' + __('App ready at ').green + templatePath);
        if (cb) cb();
      });
    }
  }

  async getExternalProject(uri) {
    let url, folder, hgi;
    let fallback, url_fallback, folder_fallback, hgi_fallback, embarkVersion;

    // reformat uri before parsing with hosted-git-info. Allows for further syntax support.
    Object.keys(REPLACEMENTS).forEach(replacement => {
      if(uri.indexOf(replacement) === 0) uri = uri.replace(replacement, REPLACEMENTS[replacement]);
    });
    hgi = hostedGitInfo.fromUrl(uri);
    if (!hgi || hgi.user.includes('#')) {
      let templateAndBranch = uri.split('#');
      if (templateAndBranch.length === 1) {
        fallback = true;
        embarkVersion = semver(require('../../../package.json').version);
        templateAndBranch.push(`${embarkVersion.major}.${embarkVersion.minor}`);
      }
      templateAndBranch[0] = `embark-framework/embark-${templateAndBranch[0]}-template`;
      hgi = hostedGitInfo.fromUrl(templateAndBranch.join('#'));
      if (fallback) {
        hgi_fallback = hostedGitInfo.fromUrl(templateAndBranch[0]);
      }
    }
    if(!hgi) { throw new Error('Unsupported template name or git host URL'); }
    url = hgi.tarball();
    if (fallback) {
      url_fallback = hgi_fallback.tarball();
      folder_fallback = `${hgi_fallback.user}/${hgi_fallback.project}/master`;
    }
    const returnObject = {
      url,
      browse: decodeURIComponent(hgi.browse()),
      url_fallback,
      filePath_fallback: fallback && joinPath(".embark/templates/", folder_fallback, "archive.zip"),
      browse_fallback: fallback && decodeURIComponent(hgi_fallback.browse()),
      embarkVersion
    };
    if (hgi.committish) {
      folder = `${hgi.user}/${hgi.project}/${hgi.committish}`;
      returnObject.filePath = joinPath(".embark/templates/", folder, "archive.zip");
      return returnObject;
    }
    return new Promise((resolve, reject) => {
      const request = require('request');
      request.get({
        url: `https://api.github.com/repos/${hgi.user}/${hgi.project}`, json: true, headers: {
          'User-Agent': 'embark'
        }
      }, (err, resp, body) => {
        if (err) {
          return reject(err);
        }
        folder = `${hgi.user}/${hgi.project}/${body.default_branch}`;
        returnObject.url = returnObject.url.replace('/master', '/' + body.default_branch);
        returnObject.filePath = joinPath(".embark/templates/", folder, "archive.zip");
        resolve(returnObject);
      });
    });
  }
}
module.exports = TemplateGenerator;
