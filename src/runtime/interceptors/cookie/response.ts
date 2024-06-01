import { appendResponseHeader, splitCookiesString } from 'h3';
import type { FetchContext } from 'ofetch';
import type { ConsolaInstance } from 'consola';
import { navigateTo, useRequestEvent, type NuxtApp } from '#app';

export default async function handleResponseHeaders(
    app: NuxtApp,
    ctx: FetchContext,
    logger: ConsolaInstance
) {
    if (ctx.response === undefined) {
        logger.debug('No response to process');

        return;
    }

    // pass all cookies from the API to the client on SSR response
    if (import.meta.server) {
        const event = useRequestEvent(app);
        const serverCookieName = 'set-cookie';
        const cookieHeader = ctx.response.headers.get(serverCookieName);

        if (cookieHeader === null || event === undefined) {
            logger.debug(`No cookies to pass to the client [${ctx.request}]`);

            return;
        }

        const cookies = splitCookiesString(cookieHeader);
        const cookieNameList = [];

        for (const cookie of cookies) {
            appendResponseHeader(event, serverCookieName, cookie);

            const cookieName = cookie.split('=')[0];
            cookieNameList.push(cookieName);
        }

        logger.debug(
            `Append API cookies from SSR to CSR response [${cookieNameList.join(', ')}]`
        );
    }

    // follow redirects on client
    if (ctx.response.redirected) {
        await app.runWithContext(() => navigateTo(ctx.response!.url));
    }
}