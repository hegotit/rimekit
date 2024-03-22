<template>
  <div v-show="visible">
    <form class="form-search" @submit.prevent="updateQuery" style="margin: 20px">
      <div :class="{ 'input-append control-group': true, error: error }">
        <input type="text" class="span2 search-query" v-model.trim="value" @input="validate" />
        <button type="submit" class="btn" :disabled="!!error">查询</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, type PropType } from 'vue';

const props = defineProps({
  visible: Boolean,
  update: Function as PropType<(query: RegExp | null) => void>,
});

const value = ref('');
const error = ref<string | null>(null);

const validate = () => {
  try {
    new RegExp(value.value);
    error.value = null;
  } catch {
    error.value = 'Invalid regular expression';
  }
};

const updateQuery = () => {
  if (!error.value && props.update) {
    props.update(new RegExp(value.value));
  }
};

watch(
  () => props.visible,
  () => {
    // 可以在可见性改变时做一些处理
  }
);
</script>

<style scoped>
.error {
  /* 错误提示样式 */
  color: red;
}
</style>
