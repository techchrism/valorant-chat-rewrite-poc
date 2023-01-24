// Workaround from https://github.com/DefinitelyTyped/DefinitelyTyped/issues/60924#issuecomment-1358424866
export {}

declare global {
    export const {
        fetch,
        FormData,
        Headers,
        Request,
        Response
    }: typeof import('undici')
}