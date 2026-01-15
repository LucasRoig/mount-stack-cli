import { intro, outro } from "@clack/prompts";
import color from "picocolors";

function main() {
  intro(color.inverse("Mount stack"));
  outro("Done !");
}

main();
