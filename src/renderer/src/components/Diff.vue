<template>
  <div :class="`code ${classType}`">
    <!-- 内容显示区  -->
  </div>
</template>

<script setup lang="ts">
import { computed, watch, type PropType } from 'vue';

const props = defineProps({
  value: String,
  type: {
    type: String as PropType<'script' | 'string'>,
    default: 'string',
  },
});

const classType = computed(() => (props.type === 'script' ? 'script-diff' : 'string-diff'));

watch(
  () => props.value,
  (newValue) => {
    // 这里可以根据type来调用不同的处理函数
    if (props.type === 'script') {
      scriptDiff(newValue);
    } else {
      stringDiff(newValue);
    }
  }
);

function scriptDiff(_value: string | undefined) {
  // 脚本差异处理逻辑
}

function stringDiff(_value: string | undefined) {
  // 字符串差异处理逻辑
}
</script>

<style scoped></style>
