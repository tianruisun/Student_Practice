/* Cloudflare Pages Function: every /api/* request goes to the server module (v2.0.0). */
import { handle } from '../../server/api.js';

export const onRequest = ctx => handle(ctx.request, ctx.env);
