import crossSpawn from 'cross-spawn';
import fs from 'fs-extra';
import path from 'path';
import pkgDir from 'pkg-dir';
import { Platform } from '@sphinxdoc/core';
import { createMonitor } from 'watch';

const rootPath = pkgDir.sync(process.cwd());

export default class Rtd extends Platform {
  constructor(...args) {
    super(...args);
    this.gatsbyCli = path.resolve(
      pkgDir.sync(
        require.resolve('gatsby-cli', {
          paths: path.resolve(rootPath, 'node_modules')
        })
      ),
      'lib/index.js'
    );
    this.gatsbyTheme = pkgDir.sync(
      require.resolve('@sphinxdoc/gatsby-theme', {
        paths: path.resolve(rootPath, 'node_modules')
      })
    );
  }

  async build(buildGatsby = true, rebuild = false) {
    if (this.output !== 'gatsby' && this.output !== 'html') {
      return super.build();
    }
    if (!rebuild) await this.clean(false);
    const { paths } = this;
    const buildPath = path.resolve(paths.working, 'build');
    const distPath = path.resolve(paths.project, 'dist/docs/gatsby');
    const gatsbyPath = path.resolve(paths.working, '_gatsby');
    await this.loadEnvironment();
    await this.python([
      '-m',
      'sphinx',
      '-M',
      'jekyll',
      paths.working,
      buildPath
    ]);
    fs.mkdirsSync(distPath);
    if (!rebuild) {
      fs.copySync(this.gatsbyTheme, gatsbyPath, {
        filter: (_src, dest) => !/\/node_modules/.test(dest)
      });
      fs.symlinkSync(
        fs.existsSync(path.resolve(__dirname, '../../../lerna.json'))
          ? path.resolve(__dirname, '../../gatsby-theme/node_modules')
          : path.resolve(rootPath, 'node_modules'),
        path.resolve(gatsbyPath, 'node_modules')
      );
    }
    fs.copySync(paths.docs, path.resolve(gatsbyPath, 'src/pages'), {
      filter: src => /\.js$/.test(src)
    });
    fs.copySync(
      path.resolve(buildPath, 'jekyll'),
      path.resolve(gatsbyPath, 'src/pages')
    );
    if (buildGatsby) await this.buildGatsby();
    return null;
  }

  async buildGatsby() {
    const { paths } = this;
    const distPath = path.resolve(paths.project, 'dist/docs/gatsby');
    const gatsbyPath = path.resolve(paths.working, '_gatsby');
    await this.gatsby(['build']);
    fs.mkdirsSync(distPath);
    return fs.copySync(path.resolve(gatsbyPath, 'public'), distPath);
  }

  async start() {
    const { paths } = this;
    await this.clean(false);
    await this.build(false);
    const monitor = await new Promise(resolve => {
      return createMonitor(
        paths.project,
        {
          ignoreDirectoryPattern: /node_modules/,
          ignoreDotFiles: true
        },
        resolve
      );
    });
    monitor.on('changed', async () => {
      await this.build(false, true);
    });
    if (this.serve) {
      return this.gatsby('develop', [
        '-p',
        this.port,
        ...(this.open ? ['-o'] : [])
      ]);
    }
    return this.buildGatsby();
  }

  async gatsby(command, args) {
    const { options } = this.config;
    const { paths } = this;
    const gatsbyPath = path.resolve(paths.working, '_gatsby');
    return new Promise((resolve, reject) => {
      const cp = crossSpawn(
        'node',
        [
          this.gatsbyCli,
          command,
          ...(options.debug || options.verbose ? ['--verbose'] : []),
          ...args
        ],
        {
          cwd: gatsbyPath,
          stdio: 'inherit'
        }
      );
      cp.on('close', resolve);
      cp.on('error', reject);
    });
  }
}
