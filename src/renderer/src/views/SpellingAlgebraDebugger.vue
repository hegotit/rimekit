<template>
  <el-container>
    <el-header>
      <div>
        <el-form label-position="right">
          <el-form-item label="输入方案" prop="schemaId">
            <el-input v-model="schemaId" placeholder="Rime 输入方案标识" />
          </el-form-item>
          <el-form-item label="设定项" prop="configKey">
            <el-row>
              <el-select v-model="configKey" filterable placeholder="以 / 分隔的键值">
                <el-option v-for="key in configKeys" :key="key" :label="key" :value="key"></el-option>
              </el-select>
              <el-button type="primary" @click="loadSchema">载入设置</el-button>
            </el-row>
          </el-form-item>
          <el-form-item v-if="isProjector && rules?.length" label="詞典">
            <el-input v-model="dictName" placeholder="与输入方案关联的词典名">
              <template #append>
                <el-button @click="loadDict">载入音节表</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item v-if="isFormatter" label="测试文字">
            <el-input v-model="testString" @input="calculate" />
          </el-form-item>
        </el-form>
      </div>
    </el-header>
    <el-main>
      <el-alert
        v-for="(alert, index) in alerts"
        :key="index"
        :type="alert.type"
        :closable="true"
        @close="closeAlert(index)"
      >
        {{ alert.msg }}
      </el-alert>
    </el-main>
    <el-footer>
      <el-table v-show="rules?.length" :data="rules" border stripe style="width: 100%">
        <el-table-column label="规则" width="180">
          <template #default="scope">
            <div class="code" :class="`error-${scope.row.error}`" @click="selectRule(scope.$index)">
              {{ scope.row.formula }}
            </div>
            <query v-if="isProjector && selectedIndex === scope.$index" @update="querySpellings(scope.$index)"></query>
          </template>
        </el-table-column>
        <el-table-column v-if="isProjector" class="code" label="查询结果" width="180">
          <template #default="scope">
            <div class="code">
              <!-- 这里假设rule.queryResult是个字符串，实际上可能需要根据实际内容调整 -->
              {{ scope.row.queryResult }}
            </div>
            <diff type="script" :value="scope.row.queryResult"></diff>
          </template>
        </el-table-column>
        <el-table-column v-if="isFormatter" class="code" label="拼写">
          <template #default="scope">
            <div class="code">
              {{ scope.row.spelling }}
            </div>
            <diff :value="scope.row.spelling"></diff>
          </template>
        </el-table-column>
      </el-table>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Rule } from '../rime/algebra';

import Query from '../components/Query.vue';
import Diff from '../components/Diff.vue';
// import * as fs from 'node:fs';
import { Config } from '../rime/config';
// import { getRimeDirectories } from '../rime/rimekit';

// 定义传入组件的Props
// defineProps({
//   isProjector: Boolean,
//   isFormatter: Boolean,
// });

const schemaId = ref('luna_pinyin');
const configKey = ref('speller/algebra');
const configKeys = ref<string[]>([
  'speller/algebra',
  'translator/preedit_format',
  'translator/comment_format',
  'reverse_lookup/preedit_format',
  'reverse_lookup/comment_format',
]);
console.log('before rimeUserDir');
// const rimeUserDir = await getRimeDirectories()?.[0];
console.log('after rimeUserDir');
const selectedIndex = ref(-1);
const filteredConfigKeys = ref<string[]>([]);
const isProjector = ref(false);
const rules = ref<Rule[]>([]);
const syllabary = ref([]);
const dictName = ref('');
const isFormatter = ref(false);
const testString = ref('');
const alerts = ref([{ type: 'error', msg: '示例警告消息' }]);

// 选择规则的方法
function selectRule(index: number) {
  selectedIndex.value = index;
}

const closeAlert = (index: number) => {
  alerts.value.splice(index, 1);
};

/*watch(configKey, (newValue) => {
  if (!newValue) {
    filteredConfigKeys.value = [];
    return;
  }
  filteredConfigKeys.value = configKeys.value.filter((key) => key.toLowerCase().includes(newValue.toLowerCase()));
});*/

/*const filterKeys = (query) => {
  if (query !== '') {
    filteredConfigKeys.value = configKeys.value.filter((key) => key.toLowerCase().includes(query.toLowerCase()));
  } else {
    // 当输入框聚焦但没有输入值时，显示全部选项
    filteredConfigKeys.value = configKeys.value;
  }
};*/

const selectConfigKey = (key: string) => {
  configKey.value = key;
  filteredConfigKeys.value = [];
};

const loadSchema = async () => {
  rules.value = [];
  syllabary.value = [];
  alerts.value.length = 0;
  if (!schemaId.value || !configKey.value) {
    return;
  }
  // const filePath = `${rimeUserDir || '.'}/${schemaId.value}.schema.yaml`;
  // if (!fs.existsSync(filePath)) {
  //   // 前端项目中直接使用 fs 模块不可行，需要调整
  //   console.warn(`file does not exist: ${filePath}`);
  //   alerts.value.push({ type: 'error', msg: '找不到输入方案' });
  //   return;
  // }
  const config = new Config();
  try {
    // await config.loadFromFile(filePath);
    const dictName = ref(config.get('translator/dictionary') || '');
    const loadedRules = config.get(configKey.value);
    if (loadedRules) {
      rules.value = loadedRules.map((x) => new Rule(x));
      console.log(`${rules.value.length} rules loaded.`);
      if (rules.value.length !== 0) {
        // rules.value.unshift(new Rule()); // initial state
      }
      const isProjector = /\/algebra$/.test(configKey.value);
      const isFormatter = /format$/.test(configKey.value);
      // calculate(); // 确保你已经定义了 calculate 方法或逻辑
    }
  } catch (err) {
    alerts.value.push({ type: 'error', msg: '載入输入方案錯誤' });
  }
};

const loadDict = () => {
  // 实现加载配置的逻辑
  console.log('加载配置:', configKey.value);
};

const calculate = () => {
  // 在这里实现calculate函数的逻辑
  console.log(testString.value); // 示例：打印当前testString的值
};
// const querySpellings = (index: number, query: any) => {
//   // 实现查询拼写逻辑
// };
// 更新查询拼写的方法，需按实际业务逻辑实现
function querySpellings(query: RegExp) {
  console.log('Updating spellings with query:', query);
  // 实现更新逻辑
}
</script>
<style scoped>
.el-container {
  display: flex;
  justify-content: center;
  max-width: 1200px;
  /*
  */
  /*max-height: 1000px;*/
  background: #f9f9f9;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.06);
  flex-direction: column; /* 子元素垂直排列 */
  align-items: stretch; /* 子元素拉伸以填充交叉轴 */
  height: 100%; /* 确保容器高度充满整个屏幕 */
  margin: 0 auto; /* 水平居中容器 */
  padding: 20px; /* 增加一些内边距 */
  box-sizing: border-box; /* 边框和内边距的宽度包含在宽度内 */
}

.el-header,
.el-footer {
  flex-shrink: 0; /* 防止header和footer收缩 */
}

.el-main {
  flex-grow: 1; /* main部分占据所有剩余空间 */
  overflow-y: auto; /* 如果内容过多，允许垂直滚动 */
}

/* 适应小屏幕尺寸 */
@media (max-width: 768px) {
  .el-header,
  .el-footer {
    padding: 10px; /* 在小屏幕上减少内边距 */
  }
  .el-main {
    padding: 10px; /* 在小屏幕上减少内边距 */
  }
}
</style>
