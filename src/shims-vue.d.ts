declare module '*.vue' {
    import { DefineComponent } from 'vue'

    const component: DefineComponent<{}, {}, any> // eslint-disable-line @typescript-eslint/ban-types

    export default component
}
