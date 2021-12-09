<template>
    <div class="app__frame">
        <div class="app__frame-body">
            <slot />
        </div>
    </div>
</template>

<style>
    .app__frame {
        display: flex;
        flex-direction: column;
        max-height: 100vh;
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
    }

    .app__frame-body {
        padding: 0 25px 25px 25px;
        overflow: auto;
    }
</style>
