import fs from 'node:fs';
import path from 'node:path';

/**
 * Racine du dépôt, trouvée en remontant depuis ce fichier jusqu'au
 * package.json qui déclare les workspaces.
 *
 * On ne peut pas se fier à process.cwd() : `npm start` à la racine délègue au
 * workspace, donc le process démarre avec cwd = packages/server, et
 * `resolve(cwd, 'tenants')` pointait sur un dossier inexistant. Repartir de
 * l'emplacement du module rend la résolution indépendante du répertoire
 * d'invocation (racine, packages/server, Docker, tsx ou dist compilé).
 */
export function repoRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    const pkg = path.join(dir, 'package.json');
    if (fs.existsSync(pkg)) {
      try {
        if (JSON.parse(fs.readFileSync(pkg, 'utf8')).workspaces) return dir;
      } catch {
        // package.json illisible : on continue à remonter
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Repli : comportement historique basé sur le répertoire courant.
  return process.cwd();
}
