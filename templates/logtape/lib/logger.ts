import { configure, getConsoleSink } from "@logtape/logtape";
import { getPrettyFormatter } from "@logtape/pretty";

const sink = process.env.NODE_ENV === "development" ? "prettyConsole" : "console";
await configure({
  sinks: {
    prettyConsole: getConsoleSink({
      formatter: getPrettyFormatter({
        timestamp: "rfc3339",
        level: "FULL",
        messageColor: "blue",
        messageStyle: ["reset"],
        categoryColor: "green",
        categoryStyle: ["italic"],
        timestampColor: "white",
      }),
    }),
    console: getConsoleSink(),
  },
  loggers: [
    { category: ["next"], sinks: [sink], lowestLevel: "debug" },
  ],
  contextLocalStorage: new AsyncLocalStorage(),
});
