<script setup lang="ts">
import { useRouter } from 'vue-router';
useRouter().push('/home');
</script>

<template>
  <div class="root-content">
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<style lang="less">
@import './styles/var.less';
#app {
  display: flex;
  height: 100vh;
  width: 100vw;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.root-content {
  box-sizing: border-box;
  /*width: var(--page-width);*/
  /* max-width: var(--page-max-width);*/
  /* height: var(--page-height);*/
  box-shadow: 10px 20px 60px rgba(0, 0, 0, 0.1);
  border-radius: 0;
  /*  padding: var(--app-padding);*/
  border: 1px solid var(--gray-010);
  position: relative;
  color: var(--black);

  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}
</style>
