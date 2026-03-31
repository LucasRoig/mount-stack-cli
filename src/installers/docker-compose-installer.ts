import fs from "node:fs/promises";
import { updateYamlFile } from "../helpers/yaml-file";

type DockerComposeInstallerCreateArgs = {
  path: string;
};

type ServiceDefinition = {
  serviceName: string;
  containerName?: string;
  image: string;
  ports?: string[];
  environment?: Record<string, string>;
  volumes?: string[];
  command?: string;
};

export class DockerComposeInstaller {
  public static async create(args: DockerComposeInstallerCreateArgs): Promise<DockerComposeInstaller> {
    const installer = new DockerComposeInstaller(args.path);
    await installer.init(args);
    return installer;
  }

  private constructor(private path: string) { }

  private async init(args: DockerComposeInstallerCreateArgs) {
    if (await fs.stat(args.path).catch(() => false)) {
      throw new Error(`File already exists at path ${args.path}`);
    }
    await fs.writeFile(args.path, "");
  }

  public async addService(args: ServiceDefinition) {
    await updateYamlFile(this.path, (data) => {
      data.services = data.services || {};
      data.services[args.serviceName] = {
        container_name: args.containerName,
        image: args.image,
        ports: args.ports,
        environment: args.environment,
        volumes: args.volumes,
        command: args.command,
      };
    });
  }

  public async addManagedVolume(name: string) {
    await updateYamlFile(this.path, (data) => {
      data.volumes = data.volumes || {};
      data.volumes[name] = {};
    });
  }
}
