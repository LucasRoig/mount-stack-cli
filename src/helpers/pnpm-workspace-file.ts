import { updateYamlFile } from "./yaml-file";

export class PnpmWorkspaceFile {
  public constructor(public readonly path: string) {}

  public addToCatalog(packageName: string, version: string) {
    return updateYamlFile(this.path, (data) => {
      data.catalog = data.catalog || {};
      data.catalog[packageName] = version;
    });
  }

  public addToOverrides(packageName: string, version: string) {
    return updateYamlFile(this.path, (data) => {
      data.overrides = data.overrides || {};
      data.overrides[packageName] = version;
    });
  }
}
