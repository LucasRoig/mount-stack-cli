import fs from "fs/promises";
import { match, P } from "ts-pattern";

type PrismaSchema = PrismaRootNode[];

type PrismaRootNode = DatasourceNode | GeneratorNode | ModelNode;

type DatasourceNode = {
  kind: "datasource";
  name: string;
  content: string;
};

type GeneratorNode = {
  kind: "generator";
  name: string;
  content: string;
};

type ModelNode = {
  kind: "model";
  name: string;
  content: ModelContentNode[];
};

type ModelContentNode = FieldNode | ModelAttibuteNode;

type FieldNode = {
  kind: "field";
  content: string;
};

type ModelAttibuteNode = {
  kind: "modelAttribute";
  content: string;
};

function parsePrismaSchema(schemaStr: string): PrismaSchema {
  const tokens = schemaStr
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `${line} \n`)
    .map((line) => line.replace(/{/g, " { "))
    .map((line) => line.replace(/}/g, " } "))
    .flatMap((line) => line.split(" "))
    .filter((token) => token.length > 0);
  let tokenIndex = 0;

  const getCurrentToken = () => {
    const t = tokens[tokenIndex];
    if (t === undefined) {
      throw new Error("Unexpected end of schema");
    }
    return t;
  };
  const advanceToken = () => {
    tokenIndex++;
    return getCurrentToken();
  };
  const _peekNextToken = () => {
    const t = tokens[tokenIndex + 1];
    if (t === undefined) {
      throw new Error("Unexpected end of schema");
    }
    return t;
  };

  function parseDatasource(): DatasourceNode {
    if (tokens[tokenIndex] !== "datasource") {
      throw new Error(`Expected 'datasource', got '${tokens[tokenIndex]}'`);
    }
    const name = advanceToken();
    const openingBrace = advanceToken();
    if (openingBrace !== "{") {
      throw new Error(`Expected '{' after datasource name, got '${openingBrace}'`);
    }
    let content = "";
    tokenIndex++; // consume the opening brace
    while (getCurrentToken() !== "}") {
      content += `${getCurrentToken()} `;
      tokenIndex++;
    }
    tokenIndex++; // consume the closing brace

    return {
      kind: "datasource",
      name,
      content: content.trim(),
    };
  }

  function parseGenerator(): GeneratorNode {
    if (tokens[tokenIndex] !== "generator") {
      throw new Error(`Expected 'generator', got '${tokens[tokenIndex]}'`);
    }
    const name = advanceToken();
    const openingBrace = advanceToken();
    if (openingBrace !== "{") {
      throw new Error(`Expected '{' after generator name, got '${openingBrace}'`);
    }
    let content = "";
    tokenIndex++; // consume the opening brace
    while (getCurrentToken() !== "}") {
      content += `${getCurrentToken()} `;
      tokenIndex++;
    }
    tokenIndex++; // consume the closing brace
    return {
      kind: "generator",
      name,
      content: content.trim(),
    };
  }

  function parseField(): FieldNode {
    let content = "";
    while (getCurrentToken() !== "\n") {
      content += `${getCurrentToken()} `;
      tokenIndex++;
    }
    tokenIndex++; // consume the newline
    return {
      kind: "field",
      content: content.trim(),
    };
  }

  function parseModelAttribute(): ModelAttibuteNode {
    let content = "";
    while (getCurrentToken() !== "\n") {
      content += `${getCurrentToken()} `;
      tokenIndex++;
    }
    tokenIndex++; // consume the newline
    return {
      kind: "modelAttribute",
      content: content.trim(),
    };
  }

  function parseModel(): ModelNode {
    if (tokens[tokenIndex] !== "model") {
      throw new Error(`Expected 'model', got '${tokens[tokenIndex]}'`);
    }
    const name = advanceToken();
    const openingBrace = advanceToken();
    if (openingBrace !== "{") {
      throw new Error(`Expected '{' after model name, got '${openingBrace}'`);
    }
    const content: ModelContentNode[] = [];
    tokenIndex++; // consume the opening brace
    while (getCurrentToken() !== "}") {
      const node = match(getCurrentToken())
        .with(P.string.startsWith("@@"), () => parseModelAttribute())
        .with(" ", "\n", () => {
          tokenIndex++;
          return undefined;
        })
        .otherwise(() => parseField());
      if (node) {
        content.push(node);
      }
    }
    tokenIndex++; // consume the closing brace
    return {
      kind: "model",
      name,
      content,
    };
  }

  const schema: PrismaSchema = [];
  while (tokenIndex < tokens.length) {
    const node = match(getCurrentToken())
      .with("datasource", () => parseDatasource())
      .with("generator", () => parseGenerator())
      .with("model", () => parseModel())
      .with(" ", "\n", () => {
        tokenIndex++;
        return undefined;
      })
      .otherwise(() => {
        throw new Error(`Unexpected token '${getCurrentToken()}' at position ${tokenIndex}`);
      });
    if (node) {
      schema.push(node);
    }
  }
  return schema;
}

export class PrismaSchemaFile {
  public readonly schema: PrismaSchema;
  private path: string | undefined;

  public static async fromFile(path: string): Promise<PrismaSchemaFile> {
    const schemaStr = await fs.readFile(path, "utf-8");
    const schema = parsePrismaSchema(schemaStr);
    return new PrismaSchemaFile(schema, path);
  }

  public static fromString(schemaStr: string, path = "schema.prisma"): PrismaSchemaFile {
    const schema = parsePrismaSchema(schemaStr);
    return new PrismaSchemaFile(schema, undefined);
  }

  private constructor(schema: PrismaSchema, path: string | undefined) {
    this.schema = schema;
    this.path = path;
  }
}
