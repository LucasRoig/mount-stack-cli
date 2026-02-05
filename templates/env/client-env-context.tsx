"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { getEnv } from "./env";

type ClientEnv = ReturnType<typeof getEnv>["client"];

const ClientEnvContext = createContext<ClientEnv | undefined>(undefined);

export function ClientEnvContextProvider(props: { children: ReactNode, clientEnv: ClientEnv }) {

  return <ClientEnvContext.Provider value={props.clientEnv}>{props.children}</ClientEnvContext.Provider>;
}

export function useClientEnv() {
  const clientEnv = useContext(ClientEnvContext);
  if (clientEnv === undefined) {
    throw new Error("useClientEnv should be used inside a ClientEnvContextProvider");
  }
  return clientEnv;
}
