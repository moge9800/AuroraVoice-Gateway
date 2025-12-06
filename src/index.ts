import type { Env } from "./models";
import { handleRequest } from "./router";

const worker: ExportedHandler<Env> = {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};

export default worker;
