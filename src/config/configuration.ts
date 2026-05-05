export default () => ({
    ENVIRONMENT: process.env.ENVIRONMENT!,
    PORT: Number.parseInt(process.env.PORT! as string),
})