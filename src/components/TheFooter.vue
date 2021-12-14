<template>
    <div class="app__footer">
        <el-link
            type="primary"
            href="https://t.me/toncoinpool"
            target="_blank"
            :underline="false"
        >
            @toncoinpool
        </el-link>
    </div>
</template>

<script lang="ts">
    import { defineComponent } from 'vue'

    import { ElLink } from 'element-plus'
    import 'element-plus/es/components/link/style/css'

    export default defineComponent({
        components: { ElLink }
    })
</script>

<style>
    .app__footer {
        text-align: center;
        padding-top: 25px;
        user-select: none;
        font-size: 14px;
    }
</style>
