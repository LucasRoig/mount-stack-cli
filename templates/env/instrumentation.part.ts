try {
  //Check env variables
  printEnv();
} catch (e) {
  if (e instanceof Error && e.cause) {
    logger.fatal("Unable to load environment variables. {error}, {cause}", { error: e.message, cause: e.cause });
  } else {
    logger.fatal("Unable to load environment variables. {error}", { error: e });
  }
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.exit(1);
  } else {
    throw e;
  }
}
