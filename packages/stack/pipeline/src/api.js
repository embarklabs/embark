const path = require('path');
import { dappPath, fileTreeSort } from 'embark-utils';

class API {

  constructor(embark, _options) {
    this.embark = embark;
    this.plugins = embark.config.plugins;
    this.fs = embark.fs;
  }

  registerAPIs() {
    this.embark.registerAPICall(
      'get',
      '/embark-api/file',
      (req, res) => {
        try {
          this.apiGuardBadFile(req.query.path);
        } catch (error) {
          return res.send({ error: error.message });
        }

        const name = path.basename(req.query.path);
        const content = this.fs.readFileSync(req.query.path, 'utf8');
        res.send({ name, content, path: req.query.path });
      }
    );

    this.embark.registerAPICall(
      'post',
      '/embark-api/folders',
      (req, res) => {
        try {
          this.apiGuardBadFile(req.body.path);
        } catch (error) {
          return res.send({ error: error.message });
        }

        this.fs.mkdirpSync(req.body.path);
        const name = path.basename(req.body.path);
        res.send({ name, path: req.body.path });
      }
    );

    this.embark.registerAPICall(
      'post',
      '/embark-api/files',
      (req, res) => {
        try {
          this.apiGuardBadFile(req.body.path);
        } catch (error) {
          return res.send({ error: error.message });
        }

        this.fs.writeFileSync(req.body.path, req.body.content, { encoding: 'utf8' });
        const name = path.basename(req.body.path);
        res.send({ name, path: req.body.path, content: req.body.content });
      }
    );

    this.embark.registerAPICall(
      'delete',
      '/embark-api/file',
      (req, res) => {
        try {
          this.apiGuardBadFile(req.query.path, { ensureExists: true });
        } catch (error) {
          return res.send({ error: error.message });
        }
        this.fs.removeSync(req.query.path);
        res.send();
      }
    );

    this.embark.registerAPICall(
      'get',
      '/embark-api/files',
      (req, res) => {
        const rootPath = dappPath();

        const walk = (dir, filelist = []) => this.fs.readdirSync(dir).map(name => {
          let isRoot = rootPath === dir;
          if (this.fs.statSync(path.join(dir, name)).isDirectory()) {
            return {
              isRoot,
              name,
              dirname: dir,
              path: path.join(dir, name),
              isHidden: (name.indexOf('.') === 0 || name === "node_modules"),
              children: fileTreeSort(walk(path.join(dir, name), filelist))
            };
          }
          return {
            name,
            isRoot,
            path: path.join(dir, name),
            dirname: dir,
            isHidden: (name.indexOf('.') === 0 || name === "node_modules")
          };
        });
        const files = fileTreeSort(walk(dappPath()));
        res.send(files);
      }
    );
  }

  apiGuardBadFile(pathToCheck, options = {ensureExists: false}) {
    const dir = path.dirname(pathToCheck);
    const error = new Error('Path is invalid');
    if (options.ensureExists && !this.fs.existsSync(pathToCheck)) {
      throw error;
    }
    if (!dir.startsWith(dappPath())) {
      throw error;
    }
  }

}

module.exports = API;
