const fs = require("../core/fs.js");
const hostedGitInfo = require("hosted-git-info");
const utils = require("./utils.js");
const semver = require("semver");
import { bold, cyan, green } from "colors";
require("colors");

const REPLACEMENTS: any = {
  "bitbucket.org/": "bitbucket:",
  "git@bitbucket.org/": "git@bitbucket.org:",
  "git@github.com/": "git@github.com:",
  "git@gitlab.com/": "git@gitlab.com:",
  "github.com/": "",
  "gitlab.com/": "gitlab:",
};

class TemplateGenerator {
  private templateName: string;

  constructor(templateName: string) {
    this.templateName = templateName;
  }

  private checkPathExists(fspath: string) {
    if (fs.existsSync(fspath)) {
      console.error(`${fspath} already exists, will not overwrite`.red);
      process.exit(1);
    }
  }

  private download(url: string, tmpFilePath: string, browse: string) {
    console.log(__("Installing template from " + browse).green);
    console.log(__("Downloading template...").green);
    fs.mkdirpSync(utils.dirname(tmpFilePath));
    return new Promise((resolve, reject) => {
      utils.downloadFile(url, tmpFilePath, (err: any) => {
        if (err) {
          console.error(utils.errorMessage(err).red);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private downloadFailed() {
    console.error("Does the template really exist?".red);
    console.error(`Embark"s supported templates: https://embark.status.im/templates/`.green);
    process.exit(1);
  }

  public async downloadAndGenerate(uri: string, destinationFolder: string, name: string) {
    const fspath = utils.joinPath(destinationFolder, name);
    this.checkPathExists(fspath);
    const self = this;
    let ext: any;
    try {
      ext = await this.getExternalProject(uri);
    } catch (e) {
      console.error(utils.errorMessage(e).red);
      process.exit(1);
    }
    const {url, filePath, browse} = ext;
    let tmpFilePath = fs.tmpDir(filePath);
    try {
      try {
        await this.download(url, tmpFilePath, browse);
      } catch (err) {
        const {url_fallback, filePath_fallback, browse_fallback, embarkVersion} = ext;
        if (url_fallback) {
          console.log(__("Retrying with the default branch...").yellow);
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
    utils.extractZip(tmpFilePath, fspath, {
      map: (file: any) => {
        const fixed_path = file.path.split("/");
        fixed_path.shift(); // remove first directory
        file.path = utils.joinPath(...fixed_path);
        return file;
      },
    }, () => {
      self.installTemplate(fspath, name, true);
    });
  }

  public generate(destinationFolder: string, name: string) {
    const fspath: any = utils.joinPath(destinationFolder, name);
    this.checkPathExists(fspath);
    console.log(__("Initializing Embark template...").green);
    const templatePath: string = fs.embarkPath(utils.joinPath("templates", this.templateName));
    fs.copySync(templatePath, fspath);

    this.installTemplate(
      fspath,
      name,
      (this.templateName === "boilerplate" || this.templateName === "demo"),
      () => {
        if (name === "embark_demo") {
          console.log("-------------------".yellow);
          console.log(__("Next steps:").green);
          console.log("-> " + green(cyan(bold("cd " + fspath))));
          console.log("-> ".green + cyan(bold("embark run")));
          console.log(__("For more info go to http://embark.status.im").green);
        }
      },
    );
  }

  private installTemplate(templatePath: string, name: string, installPackages: boolean, cb?: any) {
    utils.cd(templatePath);
    utils.sed("package.json", "%APP_NAME%", name);
    if (fs.existsSync("dot.gitignore")) {
      fs.moveSync("dot.gitignore", ".gitignore");
    } else if (!fs.existsSync(".gitignore")) {
      fs.copySync(fs.embarkPath("templates/dot.gitignore"), ".gitignore");
    }

    if (installPackages) {
      console.log(__("Installing packages...").green);
      utils.runCmd("npm install", null, (err: any) => {
        if (err) {
          console.error(utils.errorMessage(err).red);
          process.exit(1);
        }
        console.log(__("Init complete").green);
        console.log("\n" + __("App ready at ").green + templatePath);
        if (cb) {
          cb();
        }
      });
    }
  }

  private getExternalProject(uri: any) {
    let url: any;
    let folder: any;
    let hgi: any;
    let fallback: any;
    let url_fallback: any;
    let folder_fallback: any;
    let hgi_fallback: any;
    let embarkVersion: any;

    // reformat uri before parsing with hosted-git-info. Allows for further syntax support.
    Object.keys(REPLACEMENTS).forEach((replacement: string) => {
      if (uri.indexOf(replacement) === 0) {
        uri = uri.replace(replacement, REPLACEMENTS[replacement]);
      }
    });
    hgi = hostedGitInfo.fromUrl(uri);
    if (!hgi || hgi.user.includes("#")) {
      const templateAndBranch = uri.split("#");
      if (templateAndBranch.length === 1) {
        fallback = true;
        embarkVersion = semver(require("../../../package.json").version);
        templateAndBranch.push(`${embarkVersion.major}.${embarkVersion.minor}`);
      }
      templateAndBranch[0] = `embark-framework/embark-${templateAndBranch[0]}-template`;
      hgi = hostedGitInfo.fromUrl(templateAndBranch.join("#"));
      if (fallback) {
        hgi_fallback = hostedGitInfo.fromUrl(templateAndBranch[0]);
      }
    }
    if (!hgi) { throw new Error("Unsupported template name or git host URL"); }
    url = hgi.tarball();
    if (fallback) {
      url_fallback = hgi_fallback.tarball();
      folder_fallback = `${hgi_fallback.user}/${hgi_fallback.project}/master`;
    }
    const returnObject: any = {
      browse: decodeURIComponent(hgi.browse()),
      browse_fallback: fallback && decodeURIComponent(hgi_fallback.browse()),
      embarkVersion,
      filePath_fallback: fallback && utils.joinPath(".embark/templates/", folder_fallback, "archive.zip"),
      url,
      url_fallback,
    };
    if (hgi.committish) {
      folder = `${hgi.user}/${hgi.project}/${hgi.committish}`;
      returnObject.filePath = utils.joinPath(".embark/templates/", folder, "archive.zip");
      return returnObject;
    }
    return new Promise((resolve: any, reject: any) => {
      const request = require("request");
      request.get({
        headers: { "User-Agent": "embark" },
        json: true,
        url: `https://api.github.com/repos/${hgi.user}/${hgi.project}`,
      }, (err: any, resp: any, body: any) => {
        if (err) {
          return reject(err);
        }
        folder = `${hgi.user}/${hgi.project}/${body.default_branch}`;
        returnObject.url = returnObject.url.replace("/master", "/" + body.default_branch);
        returnObject.filePath = utils.joinPath(".embark/templates/", folder, "archive.zip");
        resolve(returnObject);
      });
    });
  }
}

export default TemplateGenerator;
