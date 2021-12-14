<template>
    <the-frame>
        <the-header />
        <the-form />
        <the-footer />
    </the-frame>
</template>

<script lang="ts">
    import { defineComponent } from 'vue'

    import TheFrame from './components/TheFrame.vue'
    import TheHeader from './components/TheHeader.vue'
    import TheForm from './components/TheForm.vue'
    import TheFooter from './components/TheFooter.vue'

    export default defineComponent({
        name: 'toncoinpool',
        components: {
            TheFrame,
            TheHeader,
            TheForm,
            TheFooter
        }
    })
</script>
